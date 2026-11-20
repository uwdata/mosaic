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
use tower::ServiceExt;

use crate::db::{ConnectionPool, Database};
use crate::interfaces::QueryParams;
use crate::interfaces::QueryResponse;
use crate::interfaces::{AppState, Command};
use crate::{app, query::handle};

#[tokio::test]
async fn get_arrow() -> Result<()> {
    let db = ConnectionPool::new(":memory:", 1)?;

    let state = Arc::new(AppState { db: Box::new(db) });

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
    let app = app::app(None, None)?;

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
    let app = app::app(None, None)?;

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

#[tokio::test]
async fn missing_type_is_bad_request() -> Result<()> {
    let app = app::app(None, None)?;

    let response = app
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(
                    &json!({"sql": "select 1 as foo"}),
                )?))?,
        )
        .await?;

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);

    let body = response.into_body().collect().await?.to_bytes();
    assert_eq!(body, "missing required 'type' parameter");
    Ok(())
}

#[tokio::test]
async fn preagg_returns_stable_reference() -> Result<()> {
    let app = app::app(None, None)?;
    let request = || -> Result<Request<Body>> {
        Ok(Request::builder()
            .method(http::Method::POST)
            .uri("/")
            .header(http::header::CONTENT_TYPE, "application/json")
            .body(Body::from(serde_json::to_vec(
                &json!({"type": "preagg", "sql": "select 1 as foo"}),
            )?))?)
    };

    let mut references = Vec::new();
    for _ in 0..2 {
        let response = app.clone().oneshot(request()?).await?;
        assert_eq!(response.status(), StatusCode::OK);
        let body = response.into_body().collect().await?.to_bytes();
        let value: serde_json::Value = serde_json::from_slice(&body)?;
        assert!(value["createdAt"].is_string());
        references.push(serde_json::from_value::<Vec<String>>(
            value["reference"].clone(),
        )?);
    }
    assert_eq!(references[0], references[1]);
    let [catalog, schema, table] = &references[0][..] else {
        panic!("expected three name parts");
    };
    assert_eq!((catalog.as_str(), schema.as_str()), ("memory", "mosaic"));
    assert!(table.starts_with("preagg_"));

    let sql = format!("select foo from mosaic.\"{table}\"");
    let response = app
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(
                    &json!({"type": "arrow", "sql": sql}),
                )?))?,
        )
        .await?;
    let body = response.into_body().collect().await?.to_bytes();
    assert_foo_batch(&body)
}

#[tokio::test(flavor = "multi_thread", worker_threads = 4)]
async fn concurrent_preaggs_share_builds() -> Result<()> {
    let db = Arc::new(ConnectionPool::new(":memory:", 8)?);
    let tasks: Vec<_> = (0..16)
        .map(|i| {
            let db = db.clone();
            tokio::spawn(async move {
                db.preagg(&format!(
                    "select range % 3 as k from range(100000) where {} >= 0",
                    i % 2
                ))
                .await
            })
        })
        .collect();
    let mut references = Vec::new();
    for task in tasks {
        references.push(task.await??);
    }
    references.sort();
    references.dedup();
    assert_eq!(references.len(), 2);
    Ok(())
}

fn assert_foo_batch(bytes: &[u8]) -> Result<()> {
    let mut reader = FileReader::try_new(std::io::Cursor::new(bytes), None)?;
    let actual_batch = reader.next().unwrap()?;

    let schema = Arc::new(Schema::new(vec![Field::new("foo", DataType::Int32, true)]));
    let batch = RecordBatch::try_new(schema, vec![Arc::new(Int32Array::from(vec![1]))])?;

    assert_eq!(actual_batch, batch);
    Ok(())
}
