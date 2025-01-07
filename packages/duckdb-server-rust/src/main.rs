use anyhow::Result;
use axum_server::tls_rustls::RustlsConfig;
use clap::Parser;
use listenfd::ListenFd;
use std::net::TcpListener;
use std::{net::Ipv4Addr, net::SocketAddr, path::PathBuf};
use tokio::net;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod app;
mod bundle;
mod cache;
mod db;
mod interfaces;
mod query;
mod websocket;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path of database file (e.g., "database.db". ":memory:" for in-memory database)
    #[arg(default_value = ":memory:")]
    database: String,

    /// HTTP Port
    #[arg(short, long, default_value_t = 3000)]
    port: u16,

    /// Max connection pool size
    #[arg(long, default_value_t = 10)]
    connection_pool_size: u32,

    /// Max number of cache entries
    #[arg(long, default_value_t = 1000)]
    cache_size: usize,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    // Tracing setup
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                "duckdb_server=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Creating database in '{}'", args.database);

    // App setup
    let app = app::app(
        Some(&args.database),
        Some(args.connection_pool_size),
        Some(args.cache_size),
    )?;

    // TLS configuration
    let mut config = RustlsConfig::from_pem_file(
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("localhost.pem"),
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("localhost-key.pem"),
    )
    .await;

    if config.is_err() {
        // try current directory for HTTPS keys if env didn't work
        config = RustlsConfig::from_pem_file("./localhost.pem", "./localhost-key.pem").await;
    }

    // Listenfd setup
    let addr = SocketAddr::new(Ipv4Addr::LOCALHOST.into(), args.port);
    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0)? {
        // if we are given a tcp listener on listen fd 0, we use that one
        Some(listener) => {
            listener.set_nonblocking(true)?;
            listener
        }
        // otherwise fall back to local listening
        None => TcpListener::bind(addr)?,
    };

    // Run the server
    match config {
        Err(_) => {
            tracing::warn!("No keys for HTTPS found.");
            tracing::info!(
                "DuckDB Server listening on http://{0} and ws://{0}.",
                listener.local_addr()?
            );

            let listener = net::TcpListener::from_std(listener)?;
            axum::serve(listener, app).await?;
        }
        Ok(config) => {
            tracing::info!(
                "DuckDB Server listening on http(s)://{0} and ws://{0}",
                listener.local_addr()?
            );

            axum_server_dual_protocol::from_tcp_dual_protocol(listener, config)
                .serve(app.into_make_service())
                .await?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod test;
