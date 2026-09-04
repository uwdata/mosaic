use anyhow::Result;
use arrow::{
    array::{Int32Array, RecordBatch},
    datatypes::{DataType, Field, Schema},
    ipc::reader::FileReader,
};
use axum::{
    body::Body,
    http::{self, Request, StatusCode},
};
use http_body_util::BodyExt;
use serde_json::json;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower::ServiceExt;

use crate::cache::get_key;
use crate::db::ConnectionPool;
use crate::interfaces::QueryParams;
use crate::interfaces::QueryResponse;
use crate::interfaces::{AppState, Command};
use crate::{app, query::handle};

#[test]
fn key() {
    let key = get_key("SELECT 1", &Command::Arrow);
    assert_eq!(
        key,
        "e004ebd5b5532a4b85984a62f8ad48a81aa3460c1ca07701f386135d72cdecf5.arrow"
    );
}

fn assert_foo_batch(bytes: &[u8]) -> Result<()> {
    let mut reader = FileReader::try_new(std::io::Cursor::new(bytes), None)?;
    let actual_batch = reader.next().unwrap()?;

    let schema = Arc::new(Schema::new(vec![Field::new("foo", DataType::Int32, true)]));
    let batch = RecordBatch::try_new(schema, vec![Arc::new(Int32Array::from(vec![1]))])?;

    assert_eq!(actual_batch, batch);
    Ok(())
}

#[tokio::test]
async fn get_arrow() -> Result<()> {
    let db = ConnectionPool::new(":memory:", 1)?;
    let cache = lru::LruCache::new(10.try_into()?);

    let state = Arc::new(AppState {
        db: Box::new(db),
        cache: Mutex::new(cache),
    });

    let params = QueryParams {
        query_type: Some(Command::Arrow),
        sql: Some("SELECT 1 AS foo".to_string()),
        ..QueryParams::default()
    };

    let arrow = handle(&state, params).await.unwrap();

    if let QueryResponse::Arrow(arrow) = arrow {
        assert_foo_batch(&arrow)?;
    }

    Ok(())
}

#[tokio::test]
async fn select_1_get() -> Result<()> {
    let app = app::app(None, None, None)?;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/?type=arrow&sql=SELECT%201%20as%20foo")
                .body(Body::empty())?,
        )
        .await?;

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await?.to_bytes();
    assert_foo_batch(&body)
}

#[tokio::test]
async fn query_arrow() -> Result<()> {
    let app = app::app(None, None, None)?;

    let response = app
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(
                    &json!({"type": "arrow", "sql": "select 1 as foo"}),
                )?))?,
        )
        .await?;

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await?.to_bytes();
    assert_foo_batch(&body)
}
