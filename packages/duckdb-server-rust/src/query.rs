use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

use crate::bundle::{create, load};
use crate::cache::retrieve;
use crate::interfaces::{AppError, AppState, QueryParams, QueryResponse};

pub async fn handle_query(
    state: Arc<AppState>,
    params: QueryParams,
) -> Result<QueryResponse, AppError> {
    let command = &params.query_type;
    tracing::info!("Command: '{}', Params: '{:?}'", command, params);

    match command.as_str() {
        "exec" => {
            if let Some(sql) = params.sql.as_deref() {
                state.db.execute(sql).await?;
                Ok(QueryResponse::Empty)
            } else {
                Ok(QueryResponse::BadRequest)
            }
        }
        "arrow" => {
            if let Some(sql) = params.sql.as_deref() {
                let persist = params.persist.unwrap_or(true);
                let buffer = retrieve(&state.cache, sql, command, persist, || {
                    state.db.get_arrow_bytes(sql)
                })
                .await?;
                Ok(QueryResponse::Arrow(buffer))
            } else {
                Ok(QueryResponse::BadRequest)
            }
        }
        "json" => {
            if let Some(sql) = params.sql.as_deref() {
                let persist = params.persist.unwrap_or(true);
                let json: Vec<u8> = retrieve(&state.cache, sql, command, persist, || {
                    state.db.get_json(sql)
                })
                .await?;
                let string = String::from_utf8(json)?;
                Ok(QueryResponse::Json(string))
            } else {
                Ok(QueryResponse::BadRequest)
            }
        }
        "create-bundle" => {
            if let Some(queries) = params.queries {
                let bundle_name = params.name.unwrap_or_else(|| "default".to_string());
                let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                create(state.db.as_ref(), &state.cache, queries, &bundle_path).await?;
                Ok(QueryResponse::Empty)
            } else {
                Ok(QueryResponse::BadRequest)
            }
        }
        "load-bundle" => {
            if let Some(bundle_name) = params.name {
                let bundle_path = Path::new(".mosaic").join("bundle").join(&bundle_name);
                load(state.db.as_ref(), &state.cache, &bundle_path).await?;
                Ok(QueryResponse::Empty)
            } else {
                Ok(QueryResponse::BadRequest)
            }
        }
        _ => Ok(QueryResponse::BadRequest),
    }
}
