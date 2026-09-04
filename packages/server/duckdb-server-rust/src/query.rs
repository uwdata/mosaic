use anyhow::Result;

use crate::interfaces::{AppError, AppState, Command, QueryParams, QueryResponse};

pub async fn handle(state: &AppState, params: QueryParams) -> Result<QueryResponse, AppError> {
    let command = &params.query_type;
    tracing::info!("Command: '{:?}', Params: '{:?}'", command, params);
    match command {
        Some(Command::Arrow) => {
            if let Some(sql) = params.sql.as_deref() {
                let buffer = state.db.get_arrow(sql).await?;
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
                let json = state.db.get_json(sql).await?;
                let string = String::from_utf8(json)?;
                Ok(QueryResponse::Json(string))
            } else {
                Err(AppError::BadRequest)
            }
        }
        None => Err(AppError::BadRequest),
    }
}
