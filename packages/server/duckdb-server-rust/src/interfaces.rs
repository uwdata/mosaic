use axum::{
    body::Bytes,
    http::StatusCode,
    response::{IntoResponse, Json, Response},
};
use serde::{Deserialize, Serialize};

use crate::db::Database;

pub struct AppState {
    pub db: Box<dyn Database>,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum Command {
    Arrow,
    Exec,
    Preagg,
}

#[derive(Deserialize, Serialize, Debug, Default)]
pub struct QueryParams {
    #[serde(rename = "type")]
    pub query_type: Option<Command>,
    pub sql: Option<String>,
    pub name: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PreaggResponse {
    pub reference: Vec<String>,
    pub created_at: String,
}

pub enum QueryResponse {
    Arrow(Vec<u8>),
    Preagg(PreaggResponse),
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
            QueryResponse::Preagg(response) => Json(response).into_response(),
            QueryResponse::Empty => StatusCode::OK.into_response(),
        }
    }
}

#[derive(Debug)]
pub enum AppError {
    Error(anyhow::Error),
    BadRequest(&'static str),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::Error(error) => {
                tracing::error!("Error: {:?}", error);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Something went wrong: {error}"),
                )
                    .into_response()
            }
            AppError::BadRequest(message) => (StatusCode::BAD_REQUEST, message).into_response(),
        }
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
