use anyhow::Result;
use axum::{
    extract::{ws::rejection::WebSocketUpgradeRejection, Query, State, WebSocketUpgrade},
    http::Method,
    response::Json,
    routing::get,
    Router,
};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use tower_http::{compression::CompressionLayer, trace::TraceLayer};

use crate::db::ConnectionPool;
use crate::interfaces::{AppError, AppState, QueryParams, QueryResponse};
use crate::query;
use crate::websocket;

#[axum::debug_handler]
async fn handle_get(
    State(state): State<Arc<AppState>>,
    ws: Result<WebSocketUpgrade, WebSocketUpgradeRejection>,
    Query(params): Query<QueryParams>,
) -> Result<QueryResponse, AppError> {
    if let Ok(ws) = ws {
        // WebSocket upgrade
        Ok(QueryResponse::Response(
            ws.on_upgrade(|socket| websocket::handle(socket, state)),
        ))
    } else {
        // HTTP request
        query::handle(&state, params).await
    }
}

pub const DEFAULT_DB_PATH: &str = ":memory:";
pub const DEFAULT_CONNECTION_POOL_SIZE: u32 = 10;
pub const DEFAULT_CACHE_SIZE: usize = 1000;

#[axum::debug_handler]
async fn handle_post(
    State(state): State<Arc<AppState>>,
    Json(params): Json<QueryParams>,
) -> Result<QueryResponse, AppError> {
    query::handle(&state, params).await
}

pub fn app(
    db_path: Option<&str>,
    connection_pool_size: Option<u32>,
    cache_size: Option<usize>,
) -> Result<Router> {
    // Database and state setup
    let db = ConnectionPool::new(
        db_path.unwrap_or(DEFAULT_DB_PATH),
        connection_pool_size.unwrap_or(DEFAULT_CONNECTION_POOL_SIZE),
    )?;
    let cache = lru::LruCache::new(cache_size.unwrap_or(DEFAULT_CACHE_SIZE).try_into()?);

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
