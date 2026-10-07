from __future__ import annotations


def main() -> None:
    import argparse

    from benchmark import _colorize_install
    from benchmark.config import CLIOptions

    _colorize_install.install()

    parser = argparse.ArgumentParser(
        description="Mosaic Server Benchmark",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--port", type=int, default=3000)
    parser.add_argument("--iterations", type=int, default=100)
    parser.add_argument("--warmup", type=int, default=5)
    parser.add_argument(
        "--servers",
        nargs="*",
        choices=("rust", "go", "python", "node"),
        default=("rust", "go", "python", "node"),
        help="One or more servers to test.",
    )
    args = parser.parse_args(namespace=CLIOptions())

    if args.iterations < 1:
        parser.error("--iterations must be >= 1")

    from benchmark.benches import BENCHMARKS, SOURCES
    from benchmark.runner import Runner
    from benchmark.targets import TARGETS

    server_names = set(args.servers)
    if server_names != {"rust", "go", "python", "node"}:
        targets = tuple(t for t in TARGETS if t.name in server_names)
    else:
        targets = TARGETS

    print(f"Starting benchmarks for {sorted(server_names)!r}")
    runner = Runner(args, targets, SOURCES, BENCHMARKS)
    runner.run_all()
