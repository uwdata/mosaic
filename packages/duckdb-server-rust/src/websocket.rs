use std::sync::Arc;

use axum::extract::ws::{Message, Utf8Bytes, WebSocket};
use serde_json::json;

use crate::interfaces::{AppError, AppState, QueryResponse};
use crate::query;

async fn handle_message(message: Utf8Bytes, state: &AppState) -> Result<QueryResponse, AppError> {
    let params = serde_json::from_slice(message.as_bytes())?;
    query::handle(state, params).await
}

pub async fn handle(mut socket: WebSocket, state: Arc<AppState>) {
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    let response = handle_message(text, &state).await;
                    if match response {
                        Err(error) => match error {
                            AppError::BadRequest => {
                                socket
                                    .send(Message::Text(
                                        json!({"error": "Bad request"}).to_string().into(),
                                    ))
                                    .await
                            }
                            AppError::Error(error) => {
                                socket
                                    .send(Message::Text(
                                        json!({"error": format!("{}", error)}).to_string().into(),
                                    ))
                                    .await
                            }
                        },
                        Ok(result) => match result {
                            QueryResponse::Arrow(arrow) => {
                                socket.send(Message::Binary(arrow.into())).await
                            }
                            QueryResponse::Json(json) => {
                                socket.send(Message::Text(json.into())).await
                            }
                            QueryResponse::Empty => socket.send(Message::Text("{}".into())).await,
                            QueryResponse::Response(_) => {
                                socket
                                    .send(Message::Text(
                                        json!({"error": "Unknown response Type"}).to_string().into(),
                                    ))
                                    .await
                            }
                        },
                    }
                    .is_err()
                    {
                        break;
                    }
                }
                Message::Close(_) => break,
                _ => {}
            }
        } else {
            break;
        }
    }
}
