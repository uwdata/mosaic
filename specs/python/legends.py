import json
import mosaic.vgplot as vg

meta = vg.meta(title="Legends", description="Tests for different legend types and configurations. We test both legends defined within plots (with a zero-size frame) and external legends that reference a named plot.\n")
data = {}

view = vg.vconcat(
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Color Swatch",
                            "as": "$toggle"
                        },
                        vg.name("color-categorical"),
                        vg.color_scale("categorical"),
                        vg.color_domain("$domain")
                    ),
            {
                "hspace": 35
            },
            {
                "legend": "color",
                "for": "color-categorical",
                "label": "Color Swatch (External)",
                "as": "$toggle"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "symbol",
                            "label": "Symbol Swatch",
                            "as": "$toggle"
                        },
                        vg.name("symbol-categorical"),
                        vg.symbol_domain("$domain")
                    ),
            {
                "hspace": 35
            },
            {
                "legend": "symbol",
                "for": "symbol-categorical",
                "label": "Symbol Swatch (External)",
                "as": "$toggle"
            }
        ),
    {
        "vspace": "1em"
    },
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "opacity",
                            "label": "Opacity Ramp",
                            "as": "$interval"
                        },
                        vg.name("opacity-linear"),
                        vg.opacity_domain([
                            0,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "opacity",
                "for": "opacity-linear",
                "label": "Opacity Ramp (External)",
                "as": "$interval"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "opacity"
                        },
                        vg.name("opacity-linear-no-label"),
                        vg.opacity_domain([
                            0,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "opacity",
                "for": "opacity-linear-no-label"
            }
        ),
    {
        "vspace": "1em"
    },
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Linear Color Ramp",
                            "as": "$interval"
                        },
                        vg.name("color-linear"),
                        vg.color_domain([
                            0,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-linear",
                "label": "Linear Color Ramp (External)",
                "as": "$interval"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color"
                        },
                        vg.name("color-linear-no-label"),
                        vg.color_domain([
                            0,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-linear-no-label"
            }
        ),
    {
        "vspace": "1em"
    },
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Logarithmic Color Ramp",
                            "as": "$interval"
                        },
                        vg.name("color-log"),
                        vg.color_scale("log"),
                        vg.color_domain([
                            1,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-log",
                "label": "Logarithmic Color Ramp (External)",
                "as": "$interval"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Diverging Color Ramp",
                            "as": "$interval"
                        },
                        vg.name("color-diverging"),
                        vg.color_scale("diverging"),
                        vg.color_domain([
                            -100,
                            100
                        ]),
                        vg.color_constant(20)
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-diverging",
                "label": "Diverging Color Ramp (External)",
                "as": "$interval"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Diverging Symlog Color Ramp",
                            "as": "$interval"
                        },
                        vg.name("color-diverging-symlog"),
                        vg.color_scale("diverging-symlog"),
                        vg.color_domain([
                            -100,
                            100
                        ]),
                        vg.color_constant(20)
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-diverging-symlog",
                "label": "Diverging Symlog Color Ramp (External)",
                "as": "$interval"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Quantize Color Ramp"
                        },
                        vg.name("color-quantize"),
                        vg.color_scale("quantize"),
                        vg.color_domain([
                            0,
                            100
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-quantize",
                "label": "Quantize Color Ramp (External)"
            }
        ),
    vg.hconcat(
            vg.plot(
                        {
                            "legend": "color",
                            "label": "Threshold Color Ramp"
                        },
                        vg.name("color-threshold"),
                        vg.color_scale("threshold"),
                        vg.color_domain([
                            0,
                            10,
                            20,
                            40,
                            80
                        ])
                    ),
            {
                "hspace": 30
            },
            {
                "legend": "color",
                "for": "color-threshold",
                "label": "Threshold Color Ramp (External)"
            }
        )
)

spec = vg.spec(meta=meta, params={
    "toggle": {
    "select": "single"
},
    "interval": {
    "select": "intersect"
},
    "domain": [
    "foo",
    "bar",
    "baz",
    "bop",
    "doh"
]
}, plotDefaults={
    "margin": 0,
    "width": 0,
    "height": 20
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))