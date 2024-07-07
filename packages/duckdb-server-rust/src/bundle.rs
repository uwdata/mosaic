use crate::db::Database;
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
    sql: String,
    alias: Option<String>,
}

fn get_key(sql: &str, command: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(sql);
    hasher.update(command);
    format!("{:x}.{}", hasher.finalize(), command)
}

pub async fn create_bundle(
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
            let file = bundle_dir.join(format!("{}.parquet", alias));
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
                let file = bundle_dir.join(format!("{}.parquet", table));
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
                "json"
            } else {
                "arrow"
            };
            let key = get_key(sql, command);
            let result = if command == "arrow" {
                db.get_arrow_bytes(sql).await?
            } else {
                db.get_json(sql).await?
            };

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

pub async fn load_bundle(
    db: &dyn Database,
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    bundle_dir: &Path,
) -> Result<()> {
    let manifest_file = bundle_dir.join("bundle.json");
    let manifest_json =
        fs::read_to_string(manifest_file).context("Failed to read manifest file")?;
    let manifest: Manifest =
        serde_json::from_str(&manifest_json).context("Failed to deserialize manifest")?;

    // Load precomputed query results into the cache
    let mut cache_lock = cache.lock().await;
    for key in &manifest.queries {
        let file = bundle_dir.join(key);
        let is_json = file.extension().and_then(|ext| ext.to_str()) == Some("json");
        let data = fs::read(&file).context("Failed to read query result file")?;
        if is_json {
            let json_str = String::from_utf8(data).context("Failed to parse JSON data as UTF-8")?;
            let json_value: serde_json::Value =
                serde_json::from_str(&json_str).context("Failed to parse JSON data")?;
            cache_lock.put(key.clone(), serde_json::to_vec(&json_value)?);
        } else {
            cache_lock.put(key.clone(), data);
        }
    }
    drop(cache_lock);

    // Load precomputed temp tables into the database
    for table in &manifest.tables {
        let file = bundle_dir.join(format!("{}.parquet", table));
        db.execute(&format!(
            "CREATE TEMP TABLE IF NOT EXISTS {} AS SELECT * FROM '{}'",
            table,
            file.display()
        ))
        .await?;
    }

    Ok(())
}
