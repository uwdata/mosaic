from __future__ import annotations

from benchmark.cli import CLIOptions


def main() -> None:
    from benchmark.cli import CLIOptions

    options = CLIOptions.parse_sys_argv()
    options.dispatch()


@CLIOptions.register_command(None)
def _default(options: CLIOptions) -> None:
    from benchmark.benches import BENCHMARKS, SOURCES
    from benchmark.runner import Runner
    from benchmark.targets import select_targets

    targets = select_targets(options.servers)
    options.print()
    Runner(options, targets, SOURCES, BENCHMARKS).run_all()


@CLIOptions.register_command("build")
def _build(options: CLIOptions) -> None:
    import subprocess as sp

    from benchmark.common import console
    from benchmark.targets import select_targets

    for target in select_targets(options.servers):
        console.rule(f"Building {target.link()}")
        sp.run(("pnpm", "run", "build:benchmark"), check=True, cwd=target.path)


if __name__ == "__main__":
    # NOTE: Needed for debugger
    main()
