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
use temp_testdir::TempDir;
use tokio::sync::Mutex;
use tower::ServiceExt;

use crate::bundle::{create, load, Query};
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

#[tokio::test]
async fn get_json() -> Result<()> {
    let db = ConnectionPool::new(":memory:", 1)?;
    let cache = lru::LruCache::new(10.try_into()?);

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
    let app = app::app()?;

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
    let app = app::app()?;

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
    let app = app::app()?;

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

#[tokio::test]
async fn create_and_load_bundle() -> Result<()> {
    let temp = TempDir::default();

    let db = ConnectionPool::new(":memory:", 1)?;
    let cache = &Mutex::new(lru::LruCache::new(10.try_into()?));

    let queries = vec![
        Query {sql: r#"CREATE TEMP TABLE IF NOT EXISTS flights AS SELECT * FROM read_parquet("data/flights-200k.parquet")"#.to_string(), alias: None},
        Query {sql: r#"SELECT count(*) FROM "flights""#.to_string(), alias: None},
    ];

    assert_eq!(cache.lock().await.len(), 0);

    create(&db, cache, queries, &temp).await?;

    assert_eq!(cache.lock().await.len(), 1);
    cache.lock().await.clear();

    load(&db, cache, &temp).await?;

    let cache = cache;
    assert_eq!(cache.lock().await.len(), 1);

    Ok(())
}
