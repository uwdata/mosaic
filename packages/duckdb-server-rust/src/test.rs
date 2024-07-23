use super::*;
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
use query::handle;
use serde_json::json;
use tower::ServiceExt;

use cache::get_key;
use interfaces::Command;

#[test]
fn key() {
    let key = get_key("SELECT 1", &Command::Arrow);
    assert_eq!(
        key,
        "e004ebd5b5532a4b85984a62f8ad48a81aa3460c1ca07701f386135d72cdecf5.arrow"
    );
}

#[tokio::test]
async fn get_json() -> Result<()> {
    let db = ConnectionPool::new(":memory:", 10)?;
    let cache = lru::LruCache::new(1000.try_into()?);

    let state = Arc::new(AppState {
        db: Box::new(db),
        cache: Mutex::new(cache),
    });

    let params = QueryParams {
        query_type: Some(Command::Json),
        sql: Some("SELECT 1 AS foo".to_string()),
        ..QueryParams::default()
    };

    let json = handle(&state, params).await.unwrap();

    if let QueryResponse::Json(json) = json {
        assert_eq!(json, "[{\"foo\":1}]");
    }

    Ok(())
}

#[tokio::test]
async fn get_arrow() -> Result<()> {
    let db = ConnectionPool::new(":memory:", 10)?;
    let cache = lru::LruCache::new(1000.try_into()?);

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
        let mut reader = FileReader::try_new(std::io::Cursor::new(arrow), None)?;
        let actual_batch = reader.next().unwrap();
        let actual_batch = actual_batch?;

        let schema = Arc::new(Schema::new(vec![Field::new("foo", DataType::Int32, true)]));
        let foo_values = Int32Array::from(vec![1]);
        let batch = RecordBatch::try_new(schema.clone(), vec![Arc::new(foo_values)])?;

        assert_eq!(actual_batch, batch);
    }

    Ok(())
}

#[tokio::test]
async fn select_1_get() -> Result<()> {
    let app = app()?;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/?type=json&sql=SELECT%201%20as%20foo")
                .body(Body::empty())?,
        )
        .await?;

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await?.to_bytes();
    assert_eq!(&body[..], b"[{\"foo\":1}]");

    Ok(())
}

#[tokio::test]
async fn select_1_post() -> Result<()> {
    let app = app()?;

    let response = app
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(
                    &json!({"type": "json", "sql": "select 1 as foo"}),
                )?))?,
        )
        .await?;

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await?.to_bytes();
    assert_eq!(&body[..], b"[{\"foo\":1}]");

    Ok(())
}

#[tokio::test]
async fn query_arrow() -> Result<()> {
    let app = app()?;

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

    let body = response.into_body().collect().await?;

    let mut reader = FileReader::try_new(std::io::Cursor::new(body.to_bytes()), None)?;
    let actual_batch = reader.next().unwrap();
    let actual_batch = actual_batch?;

    let schema = Arc::new(Schema::new(vec![Field::new("foo", DataType::Int32, true)]));
    let foo_values = Int32Array::from(vec![1]);
    let batch = RecordBatch::try_new(schema.clone(), vec![Arc::new(foo_values)])?;

    assert_eq!(actual_batch, batch);

    Ok(())
}
