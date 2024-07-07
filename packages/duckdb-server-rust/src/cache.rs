use tokio::sync::Mutex;
use anyhow::Result;

pub fn get_key(sql: &str, command: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(sql);
    hasher.update(command);
    format!("{:x}.{}", hasher.finalize(), command)
}

pub async fn retrieve<F, Fut>(
    cache: &Mutex<lru::LruCache<String, Vec<u8>>>,
    sql: &str,
    command: &str,
    f: F,
) -> Result<Vec<u8>>
where
    F: FnOnce() -> Fut,
    Fut: std::future::Future<Output = Result<Vec<u8>>>,
{
    let key = get_key(sql, command);
    let mut cache_lock = cache.lock().await;
    if let Some(cached) = cache_lock.get(&key) {
        tracing::debug!("Cache hit {}!", key);
        Ok(cached.clone())
    } else {
        let result = f().await?;
        cache_lock.put(key, result.clone());
        Ok(result)
    }
}
