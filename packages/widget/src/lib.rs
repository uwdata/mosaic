use pyo3::prelude::*;
use duckdb_server;

#[pyfunction]
fn get_key(sql: String, command: String) -> PyResult<String> {
    Ok(duckdb_server::get_key_strings(&sql, &command))
}

#[pymodule]
fn duckdb_server_rs(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(get_key, m)?)?;
    Ok(())
}
