from __future__ import annotations

from typing import Final

from benchmark.task import Benchmark, Command

FLIGHTS: Final = "flights-200k"
ATHLETES: Final = "athletes"
PENGUINS: Final = "penguins"

SOURCES = tuple(Command.load_parquet(stem) for stem in (FLIGHTS, ATHLETES, PENGUINS))

BENCHMARKS: Final = (
    Benchmark.arrow("tiny", "scalar", "SELECT 1 AS x"),
    Benchmark.arrow(
        "tiny", "aggregate: count", f"SELECT count(*) AS cnt FROM '{FLIGHTS}'"
    ),
    Benchmark.arrow(
        "tiny",
        "aggregate: min/max",
        f"SELECT min(delay) AS lo, max(delay) AS hi FROM '{FLIGHTS}'",
    ),
    Benchmark.arrow(
        "tiny",
        "filtered aggregate",
        f"SELECT count(*) AS cnt, avg(delay) AS mean_delay FROM '{FLIGHTS}' WHERE distance > 1000 AND delay > 0",
    ),
    Benchmark.arrow(
        "tiny",
        "group-by small: species",
        f"SELECT species, count(*) AS cnt, avg(body_mass) AS mean_mass FROM '{PENGUINS}' GROUP BY species",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "histogram: delay bins",
        f"SELECT (10 * floor(delay / 10.0)) AS bin, count(*) AS cnt FROM '{FLIGHTS}' WHERE delay BETWEEN -60 AND 180 GROUP BY bin ORDER BY bin",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "group-by: distance stats",
        f"SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay, min(delay) AS lo, max(delay) AS hi FROM '{FLIGHTS}' GROUP BY distance ORDER BY cnt DESC",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "2d-bin: heatmap",
        f"SELECT floor(time / 100.0) AS time_bin, (20 * floor(delay / 20.0)) AS delay_bin, count(*) AS cnt FROM '{FLIGHTS}' WHERE delay BETWEEN -60 AND 180 GROUP BY time_bin, delay_bin",
    ),
    Benchmark.arrow("larger", "scan: 1k rows", f"SELECT * FROM '{FLIGHTS}' LIMIT 1000"),
    Benchmark.arrow(
        "larger", "scan: 10k rows", f"SELECT * FROM '{FLIGHTS}' LIMIT 10000"
    ),
    Benchmark.arrow("larger", "full table: athletes", f"SELECT * FROM '{ATHLETES}'"),
    Benchmark.arrow(
        "complex / realistic",
        "M4-style: time-series",
        (
            f"WITH input AS MATERIALIZED (SELECT time, delay FROM '{FLIGHTS}' WHERE distance > 500) "
            "SELECT min(time) AS x, arg_min(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
            "UNION ALL "
            "SELECT max(time) AS x, arg_max(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
            "ORDER BY x"
        ),
    ),
    Benchmark.arrow(
        "complex / realistic",
        "CTE + window: running avg",
        (
            f"WITH by_dist AS (SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay FROM '{FLIGHTS}' GROUP BY distance) "
            "SELECT distance, cnt, avg(cnt) OVER (ORDER BY distance ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_avg "
            "FROM by_dist ORDER BY distance"
        ),
    ),
)
