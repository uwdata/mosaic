from __future__ import annotations


def main() -> None:
    from benchmark.cli import CLIOptions

    options = CLIOptions.parse()

    from benchmark.benches import BENCHMARKS, SOURCES
    from benchmark.runner import Runner
    from benchmark.targets import select_targets

    targets = select_targets(options.servers)
    options.print()
    Runner(options, targets, SOURCES, BENCHMARKS).run_all()


if __name__ == "__main__":
    # NOTE: Needed for debugger
    main()
