use anyhow::{Error, Result};
use arrow::record_batch::RecordBatch;
use async_stream::try_stream;
use async_stream::stream;
use async_trait::async_trait;
use axum::response::IntoResponse;
use axum_streams::StreamBodyAs;
use deadpool::managed::{Manager, Object, Pool};
use deadpool_r2d2::Runtime;
use duckdb::arrow::ipc::writer::StreamWriter;
use duckdb::DuckdbConnectionManager;
use futures::prelude::*;
use futures::stream::BoxStream;
use futures::stream::Stream;
use std::{pin::Pin, sync::Arc};
use tracing::span::Record;
use futures::future::FutureExt;
use futures::stream::StreamExt;

use crate::interfaces::adapt_anyhow_error;

#[async_trait]
pub trait Database: Send + Sync {
    async fn execute(&self, sql: String) -> Result<()>;
    async fn get_json(&self, sql: String) -> Result<Vec<u8>>;
    async fn get_arrow(&self, sql: String) -> Result<Vec<u8>>;
    // async fn stream_arrow(&self, sql: String) -> Result<impl IntoResponse>;
    async fn stream_record_batch(
        &self,
        sql: String,
    ) -> impl Stream<Item = arrow::array::RecordBatch>;// Result<BoxStream<'static, Result<RecordBatch, Error>>>;
}

type DuckDBManager = deadpool_r2d2::Manager<DuckdbConnectionManager>;
type DuckDBPool = deadpool_r2d2::Pool<DuckDBManager>;

pub struct ConnectionPool {
    pool: DuckDBPool,
}

impl ConnectionPool {
    pub fn new(db_path: &str, pool_size: usize) -> Result<Self> {
        let r2d2_manager = DuckdbConnectionManager::file(db_path)?;
        let manager: deadpool_r2d2::Manager<DuckdbConnectionManager> =
            DuckDBManager::new(r2d2_manager, Runtime::Tokio1);
        let pool = DuckDBPool::builder(manager).max_size(pool_size).build()?;
        Ok(Self { pool })
    }
}

#[async_trait]
impl Database for ConnectionPool {
    async fn execute(&self, sql: String) -> Result<()> {
        let manager = self.pool.get().await?;
        manager.interact(move |conn| conn.execute_batch(&sql))
            .await
            .map_err(adapt_anyhow_error)?;
        Ok(())
    }

    async fn get_json(&self, sql: String) -> Result<Vec<u8>> {
        let manager = self.pool.get().await?;
        let json_data = manager
            .interact(move |conn| {
                let mut stmt = conn.prepare(&sql)?;
                let arrow = stmt.query_arrow([])?;

                let buf = Vec::new();
                let mut writer = arrow::json::ArrayWriter::new(buf);
                for batch in arrow {
                    writer.write(&batch)?;
                }
                writer.finish()?;
                Ok::<Vec<u8>, Error>(writer.into_inner())
            })
            .await
            .map_err(adapt_anyhow_error)??;

        Ok(json_data)
    }

    async fn get_arrow(&self, sql: String) -> Result<Vec<u8>> {
        let manager = self.pool.get().await?;
        let buffer = manager
            .interact(move |conn| {
                let mut stmt = conn.prepare(&sql)?;
                let arrow = stmt.query_arrow([])?;
                let schema = arrow.get_schema();

                let mut buffer: Vec<u8> = Vec::new();
                {
                    let schema_ref = schema.as_ref();
                    let mut writer =
                        arrow::ipc::writer::FileWriter::try_new(&mut buffer, schema_ref)?;

                    for batch in arrow {
                        writer.write(&batch)?;
                    }

                    writer.finish()?;
                }

                Ok::<Vec<u8>, Error>(buffer)
            })
            .await
            .map_err(adapt_anyhow_error)??;

        Ok(buffer)
    }

    // async fn stream_arrow(&self, sql: String) -> Result<impl IntoResponse> {
    //     let conn = self.pool.get().await?;
    //     let stream = conn.interact(move |client| {
    //         let mut stmt = client.prepare(&sql)?;
    //         let arrow = stmt.query_arrow([])?;
    //         let schema = arrow.get_schema();

    //         let stream = async_stream::try_stream! {
    //             for batch in arrow {
    //                 yield batch;
    //             }
    //         };
    //         Ok(StreamBodyAs::arrow_ipc_with_errors(schema, stream))
    //     }).await.map_err(adapt_anyhow_error)??;

    //     let response = stream.into_response();
    //     Ok(response)
    // }

    async fn stream_record_batch(
        &self,
        sql: String,
    ) -> Result<BoxStream<'static, Result<RecordBatch, Error>>> {
        let conn = self.pool.get().await?;

        let stream = std::pin::pin! { conn
            .interact(move |conn| {
                let mut stmt = conn.prepare(&sql)?;
                let arrow = stmt.query_arrow([])?;
                let schema = arrow.get_schema();

                let stream = stream! {
                    for batch in arrow {
                        yield batch;
                    }
                };

                Ok(stream)
            })
            .await
            .map_err(adapt_anyhow_error)?? };

        Ok(stream)
    } 

    // fn stream_record_batch(&self, sql: &str) -> impl Stream<Item = Result<RecordBatch>> {
    //     let pool = self.pool.clone();
    //     async_stream::try_stream! {
    //         let conn = pool.get()?;
    //         let mut stmt = conn.prepare(sql)?;
    //         let arrow = stmt.query_arrow([])?;

    //         for batch in arrow {
    //             yield batch;
    //         }
    //     }
    // }

    // fn stream_record_batch(
    //     &self,
    //     sql: &str,
    // ) -> Pin<Box<dyn Stream<Item = Result<RecordBatch, anyhow::Error>> + Send>> {
    //     let pool = self.pool.clone();
    //     Box::pin(futures::stream::unfold(
    //         (pool, sql.to_string()),
    //         |(pool, sql)| async move {
    //             let conn = pool.get().ok()?;
    //             let mut stmt = conn.prepare(&sql).ok()?;
    //             let mut arrow = stmt.query_arrow([]).ok()?;

    //             let batch = arrow.next()?;
    //             Some((Ok(batch), (pool, sql)))
    //         },
    //     ))
    // }
}
