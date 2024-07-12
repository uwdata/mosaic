use crate::AppState;
use axum::extract::ws::{Message, WebSocket};
use futures::{SinkExt, StreamExt};
use std::sync::Arc;

pub async fn handle_websocket(mut socket: WebSocket, state: Arc<AppState>) {
    while let Some(msg) = socket.recv().await {
        if let Ok(msg) = msg {
            match msg {
                Message::Text(text) => {
                    // Handle text messages
                    let response = handle_websocket_message(text, &state).await;
                    if socket.send(Message::Text(response)).await.is_err() {
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

async fn handle_websocket_message(message: String, state: &Arc<AppState>) -> String {
    // Implement your WebSocket message handling logic here
    // You can use state.db and state.cache as needed
    format!("Received: {}", message)
}
