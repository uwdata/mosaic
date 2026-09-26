use anyhow::Result;
use clap::Parser;
use listenfd::ListenFd;
use std::net::TcpListener;
use std::{net::IpAddr, net::Ipv4Addr, net::SocketAddr};
use tokio::net;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::app::DEFAULT_CONNECTION_POOL_SIZE;
use crate::app::DEFAULT_DB_PATH;

mod app;
mod db;
mod https;
mod interfaces;
mod query;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path of database file (e.g., "database.db". ":memory:" for in-memory database)
    #[arg(default_value = DEFAULT_DB_PATH)]
    database: String,

    /// HTTP Address
    #[arg(short, long, default_value_t = Ipv4Addr::LOCALHOST.into())]
    address: IpAddr,

    /// HTTP Port
    #[arg(short, long, default_value_t = 3000)]
    port: u16,

    /// Max connection pool size
    #[arg(long, default_value_t = DEFAULT_CONNECTION_POOL_SIZE)]
    connection_pool_size: u32,
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
    let app = app::app(Some(&args.database), Some(args.connection_pool_size))?;

    let config = https::configure().await?;

    // Listenfd setup
    let addr = SocketAddr::new(args.address, args.port);
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
        None => {
            tracing::warn!("No keys for HTTPS found.");
            tracing::info!(
                "DuckDB Server listening on http://{0}.",
                listener.local_addr()?
            );

            let listener = net::TcpListener::from_std(listener)?;
            axum::serve(listener, app).await?;
        }
        Some(config) => {
            tracing::info!(
                "DuckDB Server listening on http(s)://{0}",
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
