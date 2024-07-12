use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

use crate::bundle::{create, load};
use crate::cache::retrieve;
use crate::interfaces::{AppError, AppState, Command, QueryParams, QueryResponse};

pub async fn handle_query(
    state: Arc<AppState>,
    params: QueryParams,
) -> Result<QueryResponse, AppError> {
    match &params.query_type {
        None => Err(AppError::BadRequest),
        Some(query_command) => {
            tracing::info!("Command: '{:?}', Params: '{:?}'", query_command, params);

            match query_command {
                Command::Exec => {
                    if let Some(sql) = params.sql.as_deref() {
                        state.db.execute(sql).await?;
                        Ok(QueryResponse::Empty)
                    } else {
                        Err(AppError::BadRequest)
                    }
                }
                Command::Arrow => {
                    if let Some(sql) = params.sql.as_deref() {
                        let persist = params.persist.unwrap_or(true);
                        let buffer = retrieve(&state.cache, sql, query_command, persist, || {
                            state.db.get_arrow_bytes(sql)
                        })
                        .await?;
                        Ok(QueryResponse::Arrow(buffer))
                    } else {
                        Err(AppError::BadRequest)
                    }
                }
                Command::Json => {
                    if let Some(sql) = params.sql.as_deref() {
                        let persist = params.persist.unwrap_or(true);
                        let json: Vec<u8> =
                            retrieve(&state.cache, sql, query_command, persist, || {
                                state.db.get_json(sql)
                            })
                            .await?;
                        let string = String::from_utf8(json)?;
                        Ok(QueryResponse::Json(string))
                    } else {
                        Err(AppError::BadRequest)
                    }
                }
                Command::CreateBundle => {
                    if let Some(queries) = params.queries {
                        let bundle_name = params.name.unwrap_or_else(|| "default".to_string());
                        let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                        create(state.db.as_ref(), &state.cache, queries, &bundle_path).await?;
                        Ok(QueryResponse::Empty)
                    } else {
                        Err(AppError::BadRequest)
                    }
                }
                Command::LoadBundle => {
                    if let Some(bundle_name) = params.name {
                        let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                        load(state.db.as_ref(), &state.cache, &bundle_path).await?;
                        Ok(QueryResponse::Empty)
                    } else {
                        Err(AppError::BadRequest)
                    }
                }
            }
        }
    }
}
