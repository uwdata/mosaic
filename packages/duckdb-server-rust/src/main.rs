use anyhow::Result;
use axum::{
    extract::{Query, State, WebSocketUpgrade},
    http::Method,
    response::Json,
    routing::get,
    Router,
};
use axum_server::tls_rustls::RustlsConfig;
use listenfd::ListenFd;
use std::net::TcpListener;
use std::sync::Arc;
use std::time::Duration;
use std::{net::Ipv4Addr, net::SocketAddr, path::PathBuf};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tower_http::{compression::CompressionLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod bundle;
mod cache;
mod db;
mod interfaces;
mod query;
mod websocket;

use db::ConnectionPool;
use interfaces::{AppError, AppState, QueryParams, QueryResponse};

async fn handle_get(
    State(state): State<Arc<AppState>>,
    ws: Option<WebSocketUpgrade>,
    Query(params): Query<QueryParams>,
) -> Result<QueryResponse, AppError> {
    if let Some(ws) = ws {
        // WebSocket upgrade
        Ok(QueryResponse::Response(
            ws.on_upgrade(|socket| websocket::handle(socket, state)),
        ))
    } else {
        // HTTP request
        query::handle(&state, params).await
    }
}

async fn handle_post(
    State(state): State<Arc<AppState>>,
    Json(params): Json<QueryParams>,
) -> Result<QueryResponse, AppError> {
    query::handle(&state, params).await
}

pub fn app() -> Result<Router> {
    // Database and state setup
    let db = ConnectionPool::new(":memory:", 10)?;
    let cache = lru::LruCache::new(1000.try_into()?);

    let state = Arc::new(AppState {
        db: Box::new(db),
        cache: Mutex::new(cache),
    });

    // CORS setup
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::OPTIONS, Method::POST, Method::GET])
        .allow_headers(Any)
        .max_age(Duration::from_secs(60) * 60 * 24);

    // Router setup
    Ok(Router::new()
        .route("/", get(handle_get).post(handle_post))
        .with_state(state)
        .layer(cors)
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http()))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Tracing setup
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "duckdb_server=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // App setup
    let app = app()?;

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
    tracing::info!(
        "DuckDB Server listening on http(s)://{0} and ws://{0}",
        listener.local_addr().unwrap()
    );
    axum_server_dual_protocol::from_tcp_dual_protocol(listener, config)
        .serve(app.into_make_service())
        .await?;

    Ok(())
}

#[cfg(test)]
mod test;
