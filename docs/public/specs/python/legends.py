import vgplot as vg

toggle = vg.selection.single()
interval = vg.selection.intersect()
domain = vg.param(["foo", "bar", "baz", "bop", "doh"])

view = vg.vconcat(
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Color Swatch", bind=toggle),
            vg.name("color-categorical"),
            vg.color_scale("categorical"),
            vg.color_domain(domain),
        ),
        vg.hspace(35),
        vg.color_legend(
            plot="color-categorical", label="Color Swatch (External)", bind=toggle
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.symbol_legend(label="Symbol Swatch", bind=toggle),
            vg.name("symbol-categorical"),
            vg.symbol_domain(domain),
        ),
        vg.hspace(35),
        vg.symbol_legend(
            plot="symbol-categorical", label="Symbol Swatch (External)", bind=toggle
        ),
    ),
    vg.vspace("1em"),
    vg.hconcat(
        vg.plot(
            vg.opacity_legend(label="Opacity Ramp", bind=interval),
            vg.name("opacity-linear"),
            vg.opacity_domain([0, 100]),
        ),
        vg.hspace(30),
        vg.opacity_legend(
            plot="opacity-linear", label="Opacity Ramp (External)", bind=interval
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.opacity_legend(),
            vg.name("opacity-linear-no-label"),
            vg.opacity_domain([0, 100]),
        ),
        vg.hspace(30),
        vg.opacity_legend(plot="opacity-linear-no-label"),
    ),
    vg.vspace("1em"),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Linear Color Ramp", bind=interval),
            vg.name("color-linear"),
            vg.color_domain([0, 100]),
        ),
        vg.hspace(30),
        vg.color_legend(
            plot="color-linear", label="Linear Color Ramp (External)", bind=interval
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.color_legend(),
            vg.name("color-linear-no-label"),
            vg.color_domain([0, 100]),
        ),
        vg.hspace(30),
        vg.color_legend(plot="color-linear-no-label"),
    ),
    vg.vspace("1em"),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Logarithmic Color Ramp", bind=interval),
            vg.name("color-log"),
            vg.color_scale("log"),
            vg.color_domain([1, 100]),
        ),
        vg.hspace(30),
        vg.color_legend(
            plot="color-log", label="Logarithmic Color Ramp (External)", bind=interval
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Diverging Color Ramp", bind=interval),
            vg.name("color-diverging"),
            vg.color_scale("diverging"),
            vg.color_domain([-100, 100]),
            vg.color_constant(20),
        ),
        vg.hspace(30),
        vg.color_legend(
            plot="color-diverging",
            label="Diverging Color Ramp (External)",
            bind=interval,
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Diverging Symlog Color Ramp", bind=interval),
            vg.name("color-diverging-symlog"),
            vg.color_scale("diverging-symlog"),
            vg.color_domain([-100, 100]),
            vg.color_constant(20),
        ),
        vg.hspace(30),
        vg.color_legend(
            plot="color-diverging-symlog",
            label="Diverging Symlog Color Ramp (External)",
            bind=interval,
        ),
    ),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Quantize Color Ramp"),
            vg.name("color-quantize"),
            vg.color_scale("quantize"),
            vg.color_domain([0, 100]),
        ),
        vg.hspace(30),
        vg.color_legend(plot="color-quantize", label="Quantize Color Ramp (External)"),
    ),
    vg.hconcat(
        vg.plot(
            vg.color_legend(label="Threshold Color Ramp"),
            vg.name("color-threshold"),
            vg.color_scale("threshold"),
            vg.color_domain([0, 10, 20, 40, 80]),
        ),
        vg.hspace(30),
        vg.color_legend(
            plot="color-threshold", label="Threshold Color Ramp (External)"
        ),
    ),
    plot_defaults={"margin": 0, "width": 0, "height": 20},
)

