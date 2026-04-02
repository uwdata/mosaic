#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["websockets"]
# ///
"""
Mosaic Server Benchmark

Benchmarks server implementations over HTTP POST and WebSocket,
with response-size verification.

Usage:
    ./bench.py [OPTIONS]

Options:
    -p, --port PORT         Server port (default: 3000)
    -n, --iterations N      Requests per query (default: 100)
    -w, --warmup N          Warmup requests (default: 5)
    -s, --servers LIST      Comma-separated servers to test (default: auto-detect)
                            Options: rust, go, python, node
    --ws-only               Only run WebSocket benchmarks
    --http-only             Only run HTTP benchmarks
    -h, --help              Show this help

If --servers is given (or auto-detected), each server is built, started,
benchmarked, and stopped automatically. Without it, the script expects
a server already running on the given port.
"""

from __future__ import annotations

import argparse
import asyncio
import http.client
import json
import math
import shutil
import statistics
import subprocess
import sys
import time
from pathlib import Path

import websockets

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

BENCH_DIR = Path(__file__).resolve().parent
SERVER_DIR = BENCH_DIR.parent
DATA_DIR = (SERVER_DIR / ".." / ".." / "data").resolve()

# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------

LOAD_QUERIES = [
    f"CREATE OR REPLACE TABLE flights AS SELECT * FROM read_parquet('{DATA_DIR}/flights-200k.parquet')",
    f"CREATE OR REPLACE TABLE athletes AS SELECT * FROM read_parquet('{DATA_DIR}/athletes.parquet')",
    f"CREATE OR REPLACE TABLE penguins AS SELECT * FROM read_parquet('{DATA_DIR}/penguins.parquet')",
]

# (name, type, sql)
BENCHMARKS: list[tuple[str, str, str]] = [
    # -- tiny results --
    ("scalar", "arrow", "SELECT 1 AS x"),
    ("aggregate: count", "arrow", "SELECT count(*) AS cnt FROM flights"),
    (
        "aggregate: min/max",
        "json",
        "SELECT min(delay) AS lo, max(delay) AS hi FROM flights",
    ),
    (
        "filtered aggregate",
        "arrow",
        "SELECT count(*) AS cnt, avg(delay) AS mean_delay FROM flights WHERE distance > 1000 AND delay > 0",
    ),
    (
        "group-by small: species",
        "json",
        "SELECT species, count(*) AS cnt, avg(body_mass) AS mean_mass FROM penguins GROUP BY species",
    ),
    # -- histogram / binning (medium results) --
    (
        "histogram: delay bins",
        "arrow",
        "SELECT (10 * floor(delay / 10.0)) AS bin, count(*) AS cnt FROM flights WHERE delay BETWEEN -60 AND 180 GROUP BY bin ORDER BY bin",
    ),
    (
        "group-by: distance stats",
        "json",
        "SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay, min(delay) AS lo, max(delay) AS hi FROM flights GROUP BY distance ORDER BY cnt DESC",
    ),
    (
        "2d-bin: heatmap",
        "arrow",
        "SELECT floor(time / 100.0) AS time_bin, (20 * floor(delay / 20.0)) AS delay_bin, count(*) AS cnt FROM flights WHERE delay BETWEEN -60 AND 180 GROUP BY time_bin, delay_bin",
    ),
    # -- larger results --
    ("scan: 1k rows", "arrow", "SELECT * FROM flights LIMIT 1000"),
    ("scan: 10k rows", "arrow", "SELECT * FROM flights LIMIT 10000"),
    ("full table: athletes", "arrow", "SELECT * FROM athletes"),
    # -- complex / realistic --
    (
        "M4-style: time-series",
        "arrow",
        "WITH input AS MATERIALIZED (SELECT time, delay FROM flights WHERE distance > 500) "
        "SELECT min(time) AS x, arg_min(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
        "UNION ALL "
        "SELECT max(time) AS x, arg_max(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
        "ORDER BY x",
    ),
    (
        "CTE + window: running avg",
        "arrow",
        "WITH by_dist AS (SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay FROM flights GROUP BY distance) "
        "SELECT distance, cnt, avg(cnt) OVER (ORDER BY distance ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_avg "
        "FROM by_dist ORDER BY distance",
    ),
]

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------


def http_post(host: str, port: int, payload: dict) -> bytes:
    body = json.dumps(payload).encode()
    conn = http.client.HTTPConnection(host, port, timeout=30)
    try:
        conn.request(
            "POST",
            "/",
            body=body,
            headers={
                "Content-Type": "application/json",
                "Connection": "close",
            },
        )
        resp = conn.getresponse()
        data = resp.read()
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status}: {data[:200]}")
        return data
    finally:
        conn.close()


def http_exec(host: str, port: int, sql: str) -> None:
    http_post(host, port, {"type": "exec", "sql": sql})


def http_query(host: str, port: int, qtype: str, sql: str) -> bytes:
    return http_post(host, port, {"type": qtype, "sql": sql, "persist": False})


def bench_http(
    host: str,
    port: int,
    qtype: str,
    sql: str,
    n: int,
    warmup: int,
) -> tuple[list[float], int]:
    """Returns (timings_ms, response_bytes)."""
    resp_size = 0
    for _ in range(warmup):
        data = http_query(host, port, qtype, sql)
        resp_size = len(data)

    timings: list[float] = []
    for _ in range(n):
        t0 = time.perf_counter()
        data = http_query(host, port, qtype, sql)
        elapsed = (time.perf_counter() - t0) * 1000
        timings.append(elapsed)
        resp_size = len(data)
    return timings, resp_size


# ---------------------------------------------------------------------------
# WebSocket helpers
# ---------------------------------------------------------------------------


async def ws_query(ws, qtype: str, sql: str) -> bytes:
    await ws.send(json.dumps({"type": qtype, "sql": sql, "persist": False}))
    resp = await ws.recv()
    return resp if isinstance(resp, bytes) else resp.encode()


async def bench_ws(
    uri: str,
    qtype: str,
    sql: str,
    n: int,
    warmup: int,
) -> tuple[list[float], int]:
    """Returns (timings_ms, response_bytes) over a single persistent connection."""
    resp_size = 0
    async with websockets.connect(uri, max_size=50_000_000) as ws:
        for _ in range(warmup):
            data = await ws_query(ws, qtype, sql)
            resp_size = len(data)

        timings: list[float] = []
        for _ in range(n):
            t0 = time.perf_counter()
            data = await ws_query(ws, qtype, sql)
            elapsed = (time.perf_counter() - t0) * 1000
            timings.append(elapsed)
            resp_size = len(data)
    return timings, resp_size


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def fmt_bytes(n: int) -> str:
    if n < 1024:
        return f"{n}B"
    if n < 1024 * 1024:
        return f"{n / 1024:.1f}K"
    return f"{n / (1024 * 1024):.1f}M"


HEADER_FMT = "  {:<40s} {:>6s} {:>8s} {:>8s} {:>8s} {:>8s}"
ROW_FMT = "  {:<40s} {:>6s} {:>8.2f} {:>8.2f} {:>8.2f} {:>8.2f}"


def print_header():
    print(HEADER_FMT.format("QUERY", "SIZE", "MIN", "MEDIAN", "P95", "MEAN"))
    print(HEADER_FMT.format("", "", "(ms)", "(ms)", "(ms)", "(ms)"))
    print("  " + "-" * 82)


def print_row(name: str, timings: list[float], resp_size: int):
    s = sorted(timings)
    n = len(s)
    mn = s[0]
    med = statistics.median(s)
    p95 = s[math.ceil(n * 0.95) - 1]
    avg = statistics.mean(s)
    print(ROW_FMT.format(name, fmt_bytes(resp_size), mn, med, p95, avg))


# ---------------------------------------------------------------------------
# Server management
# ---------------------------------------------------------------------------


def has_cmd(name: str) -> bool:
    return shutil.which(name) is not None


def wait_for_server(host: str, port: int, timeout: int = 30) -> bool:
    for _ in range(timeout):
        try:
            http_post(host, port, {"type": "json", "sql": "SELECT 1"})
            return True
        except Exception:
            time.sleep(1)
    return False


def stop_server(proc: subprocess.Popen) -> None:
    if proc.poll() is None:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()


def build_and_start_rust(port: int) -> subprocess.Popen | None:
    rust_dir = SERVER_DIR / "duckdb-server-rust"
    print("  Building Rust server (release) ...")
    result = subprocess.run(
        ["cargo", "build", "--release"],
        cwd=rust_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  Build failed:\n{result.stderr}")
        return None

    binary = rust_dir / "target" / "release" / "duckdb-server"
    if not binary.exists():
        print(f"  ERROR: Binary not found at {binary}")
        return None

    print("  Starting Rust server ...")
    return subprocess.Popen(
        [str(binary), "--port", str(port)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_and_start_go(port: int) -> subprocess.Popen | None:
    go_dir = SERVER_DIR / "duckdb-server-go"
    print("  Building Go server ...")
    result = subprocess.run(
        ["go", "build", "-tags=duckdb_arrow", "-o", "./duckdb-server-go", "."],
        cwd=go_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  Build failed:\n{result.stderr}")
        return None

    print("  Starting Go server ...")
    return subprocess.Popen(
        [str(go_dir / "duckdb-server-go"), f"-port={port}"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_and_start_python(port: int) -> subprocess.Popen | None:
    py_dir = SERVER_DIR / "duckdb-server"
    if port != 3000:
        print("  WARNING: Python server does not support custom ports, using 3000")
    print("  Starting Python server ...")
    return subprocess.Popen(
        ["uv", "run", "duckdb-server"],
        cwd=py_dir,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def build_and_start_node(port: int) -> subprocess.Popen | None:
    node_dir = SERVER_DIR / "duckdb"
    print("  Installing Node dependencies ...")
    result = subprocess.run(
        ["npm", "install", "--ignore-scripts"],
        cwd=node_dir,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  Install failed:\n{result.stderr}")
        return None

    if port != 3000:
        print("  WARNING: Node server does not support custom ports, using 3000")
    print("  Starting Node server ...")
    return subprocess.Popen(
        ["node", str(node_dir / "bin" / "run-server.js")],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


SERVER_BUILDERS = {
    "rust": build_and_start_rust,
    "go": build_and_start_go,
    "python": build_and_start_python,
    "node": build_and_start_node,
}

SERVER_REQUIREMENTS = {
    "rust": "cargo",
    "go": "go",
    "python": "uv",
    "node": "node",
}


def detect_servers() -> list[str]:
    return [name for name, cmd in SERVER_REQUIREMENTS.items() if has_cmd(cmd)]


# ---------------------------------------------------------------------------
# Benchmark runner
# ---------------------------------------------------------------------------

# Results: {transport: {label: median_ms}}
ServerResults = dict[str, dict[str, float]]


def run_benchmarks(
    host: str, port: int, iterations: int, warmup: int, run_http: bool, run_ws: bool
) -> ServerResults:
    ws_url = f"ws://{host}:{port}"
    results: ServerResults = {}

    # Check server
    print(f"Checking server at http://{host}:{port} ...")
    try:
        http_post(host, port, {"type": "json", "sql": "SELECT 1"})
    except Exception as e:
        print(f"ERROR: No server responding at http://{host}:{port}: {e}")
        return results
    print("Server is up.\n")

    # Load data
    print("Loading test data ...")
    for sql in LOAD_QUERIES:
        http_exec(host, port, sql)
    print("Data loaded.\n")

    # Banner
    print("Mosaic Server Benchmark")
    print(f"  Server:     http://{host}:{port}")
    print(f"  Iterations: {iterations}")
    print(f"  Warmup:     {warmup}")
    print()

    # HTTP benchmarks
    if run_http:
        http_results: dict[str, float] = {}
        print("--- HTTP POST ---\n")
        print_header()
        for name, qtype, sql in BENCHMARKS:
            label = f"{name} [{qtype}]"
            timings, size = bench_http(host, port, qtype, sql, iterations, warmup)
            print_row(label, timings, size)
            http_results[label] = statistics.median(timings)
        results["http"] = http_results
        print()

    # WebSocket benchmarks
    if run_ws:
        ws_results: dict[str, float] = {}
        print("--- WebSocket ---\n")
        print_header()
        for name, qtype, sql in BENCHMARKS:
            label = f"{name} [{qtype}]"
            timings, size = asyncio.run(
                bench_ws(ws_url, qtype, sql, iterations, warmup)
            )
            print_row(label, timings, size)
            ws_results[label] = statistics.median(timings)
        results["ws"] = ws_results
        print()

    return results


def print_comparison(all_results: dict[str, ServerResults]) -> None:
    """Print a side-by-side comparison of all servers."""
    servers = list(all_results.keys())
    if len(servers) < 2:
        return

    # Collect which transports were benchmarked
    transports: set[str] = set()
    for sr in all_results.values():
        transports.update(sr.keys())

    for transport in sorted(transports):
        transport_label = "HTTP POST" if transport == "http" else "WebSocket"

        # Only include servers that have results for this transport
        active = [s for s in servers if transport in all_results[s]]
        if len(active) < 2:
            continue

        labels = list(all_results[active[0]][transport].keys())

        # Each server gets two sub-columns: median ms + relative
        # e.g.  "  rust          go            python        node"
        #       "  0.69 (1.14x)  0.56 (0.93x)  0.60 (0.99x) 0.61 (1.01x)"
        sub_w = 14  # width per server column
        label_w = 34

        header = f"  {'QUERY':<{label_w}s}" + "".join(f" {s:>{sub_w}s}" for s in active)
        units = f"  {'':<{label_w}s}" + "".join(
            f" {'ms (rel)':>{sub_w}s}" for _ in active
        )
        sep = "  " + "-" * (label_w + (sub_w + 1) * len(active))

        print(f"=== Comparison: {transport_label} (median ms) ===\n")
        print(header)
        print(units)
        print(sep)

        for label in labels:
            vals = [all_results[s][transport].get(label) for s in active]
            valid = [v for v in vals if v is not None]
            baseline = statistics.median(valid) if valid else 1.0

            row = f"  {label:<{label_w}s}"
            for v in vals:
                if v is not None and baseline > 0:
                    rel = v / baseline
                    cell = f"{v:.2f} ({rel:.2f}x)"
                    row += f" {cell:>{sub_w}s}"
                else:
                    row += f" {'—':>{sub_w}s}"
            print(row)

        print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Mosaic Server Benchmark")
    parser.add_argument("-p", "--port", type=int, default=3000)
    parser.add_argument("-n", "--iterations", type=int, default=100)
    parser.add_argument("-w", "--warmup", type=int, default=5)
    parser.add_argument(
        "-s",
        "--servers",
        help="Comma-separated list of servers (rust,go,python,node). "
        "If omitted, auto-detects available runtimes.",
    )
    transport = parser.add_mutually_exclusive_group()
    transport.add_argument("--ws-only", action="store_true", help="WebSocket only")
    transport.add_argument("--http-only", action="store_true", help="HTTP only")
    args = parser.parse_args()

    if args.iterations < 1:
        parser.error("--iterations must be >= 1")

    host = "localhost"
    port = args.port
    run_http = not args.ws_only
    run_ws = not args.http_only

    servers = (
        [s.strip() for s in args.servers.split(",")]
        if args.servers
        else detect_servers()
    )

    if not servers:
        print("ERROR: No server runtimes found (need cargo, go, uv, or node).")
        sys.exit(1)

    print("=" * 60)
    print("  Mosaic Server Benchmark Suite")
    print("=" * 60)
    print(f"  Servers:    {', '.join(servers)}")
    print(f"  Iterations: {args.iterations}")
    print(f"  Warmup:     {args.warmup}")
    print(f"  Port:       {port}")
    print("=" * 60)
    print()

    all_results: dict[str, ServerResults] = {}

    for server in servers:
        print("-" * 60)
        print(f"  Server: {server}")
        print("-" * 60)

        builder = SERVER_BUILDERS.get(server)
        if builder is None:
            print(f"  Unknown server: {server} (skipping)\n")
            continue

        proc = builder(port)
        if proc is None:
            print("  Build/start failed, skipping.\n")
            continue

        try:
            print(f"  Waiting for server on port {port} ...")
            if not wait_for_server(host, port):
                print("  ERROR: Server did not start within 30s, skipping.\n")
                continue
            print("  Server is ready.\n")

            results = run_benchmarks(
                host, port, args.iterations, args.warmup, run_http, run_ws
            )
            if results:
                all_results[server] = results
        finally:
            stop_server(proc)

        print()

    print_comparison(all_results)

    print("=" * 60)
    print("  All benchmarks complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
