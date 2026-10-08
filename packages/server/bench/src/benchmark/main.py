from __future__ import annotations


def main() -> None:
    import argparse

    from benchmark import _colorize_install, config

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
        choices=config.DEFAULT_SERVERS,
        default=config.DEFAULT_SERVERS,
        help="One or more servers to test.",
    )
    parser.add_argument(
        "--debug-server", action="store_true", help="Redirect server output to stdout"
    )
    parser.add_argument(
        "--debug-client",
        action="store_true",
        help="Increase verbosity of client logging",
    )
    args = parser.parse_args(namespace=config.CLIOptions())

    if args.iterations < 1:
        parser.error("--iterations must be >= 1")
    if args.warmup < 1:
        parser.error("--warmup must be >= 1")

    from benchmark.benches import BENCHMARKS, SOURCES
    from benchmark.runner import Runner
    from benchmark.targets import select_targets

    targets = select_targets(args.servers)
    runner = Runner(args, targets, SOURCES, BENCHMARKS)
    runner.run_all()


if __name__ == "__main__":
    # NOTE: Needed for debugger
    main()
