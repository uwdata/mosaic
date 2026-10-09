from __future__ import annotations


def main() -> None:
    from benchmark.cli import parse_options, print_options

    args = parse_options()

    from benchmark.benches import BENCHMARKS, SOURCES
    from benchmark.runner import Runner
    from benchmark.targets import select_targets

    targets = select_targets(args.servers)
    print_options(args)
    Runner(args, targets, SOURCES, BENCHMARKS).run_all()


if __name__ == "__main__":
    # NOTE: Needed for debugger
    main()
