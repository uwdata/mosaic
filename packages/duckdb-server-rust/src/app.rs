use anyhow::Result;
use axum::{
    extract::{Query, State, WebSocketUpgrade},
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
