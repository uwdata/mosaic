use anyhow::Result;
use std::path::{Path, PathBuf};

use crate::cache::retrieve;
use crate::interfaces::{AppError, AppState, Command, QueryParams, QueryResponse};

pub async fn handle(state: &AppState, params: QueryParams) -> Result<QueryResponse, AppError> {
    let command = &params.query_type;
    tracing::info!("Command: '{:?}', Params: '{:?}'", command, params);
    match command {
        Some(Command::Arrow) => {
            if let Some(sql) = params.sql.as_deref() {
                let persist = params.persist.unwrap_or(true);
                let buffer = retrieve(&state.cache, sql, &Command::Arrow, persist, || {
                    state.db.get_arrow(sql)
                })
                .await?;
                Ok(QueryResponse::Arrow(buffer))
            } else {
                Err(AppError::BadRequest)
            }
        }
        Some(Command::Exec) => {
            if let Some(sql) = params.sql.as_deref() {
                state.db.execute(sql).await?;
                Ok(QueryResponse::Empty)
            } else {
                Err(AppError::BadRequest)
            }
        }
        Some(Command::Json) => {
            if let Some(sql) = params.sql.as_deref() {
                let persist = params.persist.unwrap_or(true);
                let json: Vec<u8> = retrieve(&state.cache, sql, &Command::Json, persist, || {
                    state.db.get_json(sql)
                })
                .await?;
                let string = String::from_utf8(json)?;
                Ok(QueryResponse::Json(string))
            } else {
                Err(AppError::BadRequest)
            }
        }
        None => Err(AppError::BadRequest),
    }
}
