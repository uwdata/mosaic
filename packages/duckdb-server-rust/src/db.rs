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

use tokio::sync::mpsc;
use tokio_stream::wrappers::ReceiverStream;

use crate::interfaces::adapt_anyhow_error;

#[async_trait]
pub trait Database: Send + Sync {
    async fn execute(&self, sql: String) -> Result<()>;
    async fn get_json(&self, sql: String) -> Result<Vec<u8>>;
    async fn get_arrow(&self, sql: String) -> Result<Vec<u8>>;
    async fn stream_record_batch(
        &self,
        sql: String,
    ) -> Result<Box<dyn Stream<Item = RecordBatch>>, Error>;
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

    async fn stream_record_batch(
        &self,
        sql: String,
    ) -> Result<Box<dyn Stream<Item = RecordBatch>>, Error> {
        let conn = self.pool.get().await?;
        let (tx, rx) = mpsc::channel(100);
    
        tokio::spawn(async move {
            let result = conn.interact(move |conn| {
                let mut stmt = conn.prepare(&sql)?;
                let arrow = stmt.query_arrow([])?;
                
                for batch in arrow {
                    if let Err(e) = tx.blocking_send(batch) {
                        tracing::error!("Error processing batch: {:?}", e);
                        break;
                    }
                }
                Ok::<_, Error>(())
            }).await;
    
            if let Err(e) = result {
                tracing::error!("Error in database interaction: {:?}", e);
            }
        });
    
        Ok(Box::new(ReceiverStream::new(rx)))
    }
}
