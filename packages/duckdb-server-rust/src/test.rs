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
use serde_json::json;
use tower::ServiceExt;

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
