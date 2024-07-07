use anyhow::Result;
use axum::{
    body::Bytes,
    extract::{Query, State},
    http::Method,
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    routing::get,
    Router,
};
use axum_server::tls_rustls::RustlsConfig;
use duckdb::Connection;
use listenfd::ListenFd;
use serde::{Deserialize, Serialize};
use std::net::TcpListener;
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use std::{net::Ipv4Addr, net::SocketAddr, path::PathBuf};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod bundle;
mod db;

use bundle::{create_bundle, load_bundle, Query as BundleQuery};
use db::{Database, DuckDbDatabase};

struct AppState {
    db: Arc<dyn Database>,
    cache: Mutex<lru::LruCache<String, Vec<u8>>>,
}

#[derive(Deserialize, Serialize, Debug)]
struct QueryParams {
    #[serde(rename = "type")]
    query_type: String,
    sql: Option<String>,
    name: Option<String>,
    queries: Option<Vec<BundleQuery>>,
}

enum QueryResponse {
    Json(String),
    Arrow(Vec<u8>),
    Empty,
}

impl IntoResponse for QueryResponse {
    fn into_response(self) -> Response {
        match self {
            QueryResponse::Json(value) => value.into_response(),
            QueryResponse::Arrow(bytes) => (
                StatusCode::OK,
                [("Content-Type", "application/octet-stream")],
                Bytes::from(bytes),
            )
                .into_response(),
            QueryResponse::Empty => StatusCode::OK.into_response(),
        }
    }
}

async fn retrieve<F, Fut>(
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    key: &str,
    f: F,
) -> Result<Vec<u8>>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>>>,
{
    let mut cache_lock = cache.lock().await;
    if let Some(cached) = cache_lock.get(key) {
        tracing::debug!("Cache hit!");
        Ok(cached.clone())
    } else {
        let result = f().await?;
        cache_lock.put(key.to_string(), result.clone());
        Ok(result)
    }
}

async fn handle_query(
    State(state): State<Arc<AppState>>,
    params: QueryParams,
) -> Result<QueryResponse, StatusCode> {
    let command = &params.query_type;
    tracing::info!("Command: '{}', Params: '{:?}'", command, params);

    match command.as_str() {
        "exec" => {
            if let Some(sql) = params.sql.as_deref() {
                state
                    .db
                    .execute(sql)
                    .await
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                Ok(QueryResponse::Empty)
            } else {
                Err(StatusCode::BAD_REQUEST)
            }
        }
        "arrow" => {
            if let Some(sql) = params.sql.as_deref() {
                let buffer = retrieve(&state.cache, sql, || state.db.get_arrow_bytes(sql))
                    .await
                    .map_err(|e| {
                        tracing::error!("Arrow retrieval error: {:?}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
                Ok(QueryResponse::Arrow(buffer))
            } else {
                Err(StatusCode::BAD_REQUEST)
            }
        }
        "json" => {
            if let Some(sql) = params.sql.as_deref() {
                let json: Vec<u8> = retrieve(&state.cache, sql, || state.db.get_json(sql))
                    .await
                    .map_err(|e| {
                        tracing::error!("JSON retrieval error: {:?}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
                let string =
                    String::from_utf8(json).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
                Ok(QueryResponse::Json(string))
            } else {
                Err(StatusCode::BAD_REQUEST)
            }
        }
        "create-bundle" => {
            if let Some(queries) = params.queries {
                let bundle_name = params.name.unwrap_or_else(|| "default".to_string());
                let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                create_bundle(state.db.as_ref(), &state.cache, queries, &bundle_path)
                    .await
                    .map_err(|e| {
                        tracing::error!("Bundle creation error: {:?}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
                Ok(QueryResponse::Empty)
            } else {
                Err(StatusCode::BAD_REQUEST)
            }
        }
        "load-bundle" => {
            if let Some(bundle_name) = params.name {
                let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                load_bundle(state.db.as_ref(), &state.cache, &bundle_path)
                    .await
                    .map_err(|e| {
                        tracing::error!("Bundle loading error: {:?}", e);
                        StatusCode::INTERNAL_SERVER_ERROR
                    })?;
                Ok(QueryResponse::Empty)
            } else {
                Err(StatusCode::BAD_REQUEST)
            }
        }
        _ => Err(StatusCode::BAD_REQUEST),
    }
}

async fn handle_get(
    State(state): State<Arc<AppState>>,
    Query(params): Query<QueryParams>,
) -> Result<QueryResponse, StatusCode> {
    handle_query(State(state), params).await
}

async fn handle_post(
    State(state): State<Arc<AppState>>,
    Json(params): Json<QueryParams>,
) -> Result<QueryResponse, StatusCode> {
    handle_query(State(state), params).await
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Tracing setup
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "duckdb_server_rust=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database and state setup
    let con = Connection::open_in_memory()?;
    let db = Arc::new(DuckDbDatabase::new(con));
    let cache = lru::LruCache::new(1000.try_into().unwrap());

    let state = Arc::new(AppState {
        db,
        cache: Mutex::new(cache),
    });

    // CORS setup
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::OPTIONS, Method::POST, Method::GET])
        .allow_headers(Any)
        .max_age(Duration::from_secs(60) * 60 * 24);

    // Router setup
    let app = Router::new()
        .route("/", get(handle_get).post(handle_post))
        .with_state(state)
        .layer(cors);

    // TLS configuration
    let config = RustlsConfig::from_pem_file(
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("localhost.pem"),
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("localhost-key.pem"),
    )
    .await
    .unwrap();

    // Listenfd setup
    let addr = SocketAddr::new(Ipv4Addr::LOCALHOST.into(), 3000);
    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0).unwrap() {
        // if we are given a tcp listener on listen fd 0, we use that one
        Some(listener) => {
            listener.set_nonblocking(true).unwrap();
            listener
        }
        // otherwise fall back to local listening
        None => TcpListener::bind(addr).unwrap(),
    };

    // Run the server
    tracing::debug!(
        "DuckDB Server listening on https://{}",
        listener.local_addr().unwrap()
    );
    axum_server::from_tcp_rustls(listener, config)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}
