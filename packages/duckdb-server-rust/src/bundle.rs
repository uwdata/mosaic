use crate::cache::{get_key, retrieve};
use crate::db::Database;
use crate::interfaces::Command;
use anyhow::{Context, Result};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize)]
pub struct Manifest {
    tables: Vec<String>,
    queries: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Query {
    pub sql: String,
    pub alias: Option<String>,
}

pub async fn create(
    db: &dyn Database,
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    queries: Vec<Query>,
    bundle_dir: &Path,
) -> Result<Manifest> {
    let describe_re = Regex::new(r"^DESCRIBE ")?;
    let pragma_re = Regex::new(r"^PRAGMA ")?;
    let view_re = Regex::new(r"^CREATE( TEMP| TEMPORARY)? VIEW")?;
    let table_re = Regex::new(r"^CREATE( TEMP| TEMPORARY)? TABLE( IF NOT EXISTS)? ([^\s]+)")?;

    let mut manifest = Manifest {
        tables: Vec::new(),
        queries: Vec::new(),
    };

    fs::create_dir_all(bundle_dir).context("Failed to create bundle directory")?;

    for query in queries {
        let sql = &query.sql;

        if let Some(alias) = &query.alias {
            let file = bundle_dir.join(format!("{alias}.parquet"));
            db.execute(&format!(
                "COPY ({}) TO '{}' (FORMAT PARQUET)",
                sql,
                file.display()
            ))
            .await?;
            manifest.tables.push(alias.clone());
        } else if sql.starts_with("CREATE ") {
            if view_re.is_match(sql) {
                continue; // Ignore views
            }

            if let Some(captures) = table_re.captures(sql) {
                let table = captures.get(3).unwrap().as_str();
                let file = bundle_dir.join(format!("{table}.parquet"));
                db.execute(sql).await?;
                db.execute(&format!(
                    "COPY {} TO '{}' (FORMAT PARQUET)",
                    table,
                    file.display()
                ))
                .await?;
                manifest.tables.push(table.to_string());
            }
        } else if !pragma_re.is_match(sql) {
            let command = if describe_re.is_match(sql) {
                Command::Json
            } else {
                Command::Arrow
            };
            let key = get_key(sql, &command);
            let result = retrieve(cache, sql, &command, true, || {
                if let Command::Arrow = command {
                    db.get_arrow(sql)
                } else {
                    db.get_json(sql)
                }
            })
            .await?;
            fs::write(bundle_dir.join(&key), &result)
                .context("Failed to write query result to file")?;
            manifest.queries.push(key);
        }
    }

    let manifest_file = bundle_dir.join("bundle.json");
    let manifest_json =
        serde_json::to_string_pretty(&manifest).context("Failed to serialize manifest")?;
    fs::write(manifest_file, manifest_json).context("Failed to write manifest to file")?;

    Ok(manifest)
}

pub async fn load(
    db: &dyn Database,
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    bundle_dir: &Path,
) -> Result<()> {
    let manifest_file = bundle_dir.join("bundle.json");
    let manifest_json =
        fs::read_to_string(&manifest_file).context("Failed to read manifest file")?;
    let manifest: Manifest =
        serde_json::from_str(&manifest_json).context("Failed to deserialize manifest")?;

    // Load precomputed query results into the cache
    let mut cache_lock = cache.lock().await;
    for key in &manifest.queries {
        tracing::debug!("Load from bundle into cache: {}", key);
        let file = bundle_dir.join(key);
        let data = fs::read(&file).context("Failed to read query result file")?;
        cache_lock.put(key.clone(), data);
    }
    drop(cache_lock);

    // Load precomputed temp tables into the database
    for table in &manifest.tables {
        let file = bundle_dir.join(format!("{table}.parquet"));
        db.execute(&format!(
            "CREATE TEMP TABLE IF NOT EXISTS {} AS SELECT * FROM '{}'",
            table,
            file.display()
        ))
        .await?;
    }

    Ok(())
}
