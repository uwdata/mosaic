use warp::Filter;
// use duckdb::{params, Connection, Result};
use warp::http::header::{HeaderMap, HeaderValue};
use warp::reply::Json;

#[tokio::main]
async fn main() {
    let mut headers = HeaderMap::new();
    headers.insert("Access-Control-Allow-Origin", HeaderValue::from_static("*"));

    // let conn = Connection::open_in_memory()?;

    fn query() -> Json {
        let our_ids = vec![1, 3, 7, 13];
        warp::reply::json(&our_ids)
    }

    let server = warp::any()
        .map(query)
        .with(warp::reply::with::headers(headers));

    println!("Listening on http://localhost:3030");

    warp::serve(server)
        .run(([127, 0, 0, 1], 3030))
        .await;
}
