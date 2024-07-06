use anyhow::Result;
use arrow::{ipc::writer::FileWriter, json::ArrayWriter};
use axum::{
    body::Bytes,
    extract::{Query, State},
    http::Method,
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    routing::get,
    Router,
};
use duckdb::{arrow::array::RecordBatch, Connection};
use listenfd::ListenFd;
use serde::{Deserialize, Serialize};
use std::net::{Ipv4Addr, SocketAddr};
use std::path::Path;
use std::sync::Arc;
use std::time::Duration;
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

struct AppState {
    con: Mutex<Connection>,
    cache: Mutex<lru::LruCache<String, Vec<u8>>>,
}

#[derive(Deserialize, Serialize)]
struct QueryParams {
    #[serde(rename = "type")]
    query_type: String,
    sql: Option<String>,
    queries: Option<Vec<String>>,
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

async fn execute(con: &Mutex<Connection>, sql: &str) -> Result<()> {
    let conn = con.lock().await;
    conn.execute_batch(sql)?;
    Ok(())
}

async fn get_json(con: &Mutex<Connection>, sql: &str) -> Result<Vec<u8>> {
    let conn = con.lock().await;
    let mut stmt = conn.prepare(sql)?;
    let arrow = stmt.query_arrow([])?;

    let rbs: Vec<RecordBatch> = arrow.collect();

    let buf = Vec::new();
    let mut writer = ArrayWriter::new(buf);
    for batch in rbs {
        writer.write(&batch)?;
    }
    writer.finish()?;
    let json_data = writer.into_inner();
    Ok(json_data)
}

async fn get_arrow_bytes(con: &Mutex<Connection>, sql: &str) -> Result<Vec<u8>> {
    let conn = con.lock().await;
    let mut stmt = conn.prepare(sql)?;
    let arrow = stmt.query_arrow([])?;
    let schema = arrow.get_schema();

    let rbs: Vec<RecordBatch> = arrow.collect();

    // Serialize RecordBatch to Arrow IPC format
    let mut buffer: Vec<u8> = Vec::new();
    {
        let schema_ref = schema.as_ref();
        let mut writer = FileWriter::try_new(&mut buffer, schema_ref)?;

        for batch in rbs {
            writer.write(&batch)?;
        }

        writer.finish()?;
    }

    // Return the serialized bytes
    Ok(buffer)
}

async fn create_bundle(
    con: &Mutex<Connection>,
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    queries: &[String],
    bundle_dir: &Path,
) -> Result<()> {
    // Save cache to bundle_dir
    // This is a placeholder and needs to be implemented based on your caching strategy
    todo!("Implement saving cache to bundle directory");
    Ok(())
}

async fn load_bundle(
    con: &Mutex<Connection>,
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    bundle_dir: &Path,
) -> Result<()> {
    // Load cache from bundle_dir
    // This is a placeholder and needs to be implemented based on your caching strategy
    todo!("Implement loading cache from bundle directory");
    Ok(())
}

async fn retrieve<F, Fut>(
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    key: &str,
    f: F
) -> Result<Vec<u8>>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>>>,
{
    let mut cache_lock = cache.lock().await;
    if let Some(cached) = cache_lock.get(key) {
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
    let sql = params.sql.as_deref().unwrap_or("");

    tracing::debug!("Command: '{}', SQL Query: '{}'", command, sql);

    match command.as_str() {
        "exec" => {
            execute(&state.con, sql)
                .await
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(QueryResponse::Empty)
        }
        "arrow" => {
            let buffer = retrieve(&state.cache, sql, || get_arrow_bytes(&state.con, sql))
                .await
                .map_err(|e| {
                    tracing::error!("Arrow retrieval error: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            Ok(QueryResponse::Arrow(buffer))
        }
        "json" => {
             let json: Vec<u8> = retrieve(&state.cache, sql, || async {
                get_json(&state.con, sql).await
            })
            .await
            .map_err(|e| {
                tracing::error!("JSON retrieval error: {:?}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
            let string = String::from_utf8(json).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok(QueryResponse::Json(string))
        }
        "create-bundle" => {
            if let Some(queries) = params.queries {
                create_bundle(
                    &state.con,
                    &state.cache,
                    &queries,
                    Path::new(".mosaic/bundle"),
                )
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
            load_bundle(&state.con, &state.cache, Path::new(".mosaic/bundle"))
                .await
                .map_err(|e| {
                    tracing::error!("Bundle loading error: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            Ok(QueryResponse::Empty)
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
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "duckdb_server_rust=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let con = Connection::open_in_memory()?;
    let cache = lru::LruCache::new(100.try_into().unwrap());

    let state = Arc::new(AppState {
        con: Mutex::new(con),
        cache: Mutex::new(cache),
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::OPTIONS, Method::POST, Method::GET])
        .allow_headers(Any)
        .max_age(Duration::from_secs(60) * 60 * 24);

    let app = Router::new()
        .route("/", get(handle_get).post(handle_post))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::new(Ipv4Addr::LOCALHOST.into(), 3000);

    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0).unwrap() {
        // if we are given a tcp listener on listen fd 0, we use that one
        Some(listener) => {
            listener.set_nonblocking(true).unwrap();
            TcpListener::from_std(listener).unwrap()
        }
        // otherwise fall back to local listening
        None => TcpListener::bind(addr).await.unwrap(),
    };

    // run it
    tracing::debug!(
        "DuckDB Server listening on http://{}",
        listener.local_addr().unwrap()
    );
    axum::serve(listener, app).await?;

    Ok(())
}
