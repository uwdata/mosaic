use anyhow::anyhow;
use axum::Json;
use axum::{
    body::Bytes,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use deadpool_r2d2::InteractError;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tokio::sync::Mutex;

use crate::bundle::Query as BundleQuery;
use crate::db::Database;

pub struct AppState {
    pub db: Box<dyn Database>,
    pub cache: Mutex<lru::LruCache<String, Vec<u8>>>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum Command {
    Arrow,
    Exec,
    Json,
    CreateBundle,
    LoadBundle,
}

#[derive(Deserialize, Serialize, Debug, Default)]
pub struct QueryParams {
    #[serde(rename = "type")]
    pub query_type: Option<Command>,
    pub persist: Option<bool>,
    pub sql: Option<String>,
    pub name: Option<String>,
    pub queries: Option<Vec<BundleQuery>>,
}

pub enum QueryResponse {
    Arrow(Vec<u8>),
    Json(String),
    Response(Response),
    Empty,
}

impl IntoResponse for QueryResponse {
    fn into_response(self) -> Response {
        match self {
            QueryResponse::Arrow(bytes) => (
                StatusCode::OK,
                [("Content-Type", "application/vnd.apache.arrow.stream")],
                Bytes::from(bytes),
            )
                .into_response(),
            QueryResponse::Json(value) => (
                StatusCode::OK,
                [("Content-Type", "application/json")],
                value,
            )
                .into_response(),
            QueryResponse::Response(response) => response,
            QueryResponse::Empty => StatusCode::OK.into_response(),
        }
    }
}

#[derive(Debug)]
pub enum AppError {
    Error(anyhow::Error),
    BadRequest,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, err_msg) = match self {
            AppError::Error(error) => {
                tracing::error!("Error: {:?}", error);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Something went wrong: {error}"),
                )
            }
            AppError::BadRequest => (StatusCode::BAD_REQUEST, "Bad request".to_string()),
        };
        (status, Json(json!({ "message": err_msg }))).into_response()
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        AppError::Error(err.into())
    }
}

pub fn adapt_anyhow_error<T: Error>(error: T) -> anyhow::Error {
    error.as_anyhow_error()
}

pub trait Error {
    fn as_anyhow_error(&self) -> anyhow::Error;
}

impl Error for InteractError {
    fn as_anyhow_error(&self) -> anyhow::Error {
        anyhow!("Interact Error {:?}", self)
    }
}
