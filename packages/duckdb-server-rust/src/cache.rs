use anyhow::Result;
use serde_json::to_string;
use tokio::sync::Mutex;

use crate::interfaces::Command;

pub fn get_key(sql: &str, command: &Command) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(sql);
    format!("{:x}.{}", hasher.finalize(), to_string(&command).unwrap())
}

pub async fn retrieve<F, Fut>(
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    sql: String,
    command: &Command,
    persist: bool,
    f: F,
) -> Result<Vec<u8>>
where
    F: FnOnce(String) -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>>>,
{
    let key = get_key(&sql, command);

    if let Some(cached) = cache.lock().await.get(&key) {
        tracing::debug!("Cache hit {}!", key);
        return Ok(cached.clone());
    }

    let result = f(sql).await?;

    if persist {
        cache.lock().await.put(key, result.clone());
    }

    Ok(result)
}
