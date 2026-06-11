import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

x = vg.param("body_mass")
y = vg.param("flipper_length")

view = vg.vconcat(
    vg.hconcat(
        vg.menu(
            label="Y",
            options=["body_mass", "flipper_length", "bill_depth", "bill_length"],
            bind=y,
        ),
        vg.menu(
            label="X",
            options=["body_mass", "flipper_length", "bill_depth", "bill_length"],
            bind=x,
        ),
    ),
    vg.vspace(10),
    vg.hconcat(
        vg.plot(
            vg.dot(
                penguins,
                x=vg.column(x),
                y=vg.column(y),
                stroke="species",
                symbol="species",
            ),
            vg.name("stroked"),
            vg.grid(True),
            vg.x_label("Body mass (g) →"),
            vg.y_label("↑ Flipper length (mm)"),
        ),
        vg.symbol_legend(plot="stroked", columns=1),
    ),
    vg.vspace(20),
    vg.hconcat(
        vg.plot(
            vg.dot(
                penguins,
                x=vg.column(x),
                y=vg.column(y),
                fill="species",
                symbol="species",
            ),
            vg.name("filled"),
            vg.grid(True),
            vg.x_label("Body mass (g) →"),
            vg.y_label("↑ Flipper length (mm)"),
        ),
        vg.symbol_legend(plot="filled", columns=1),
    ),
)

spec = vg.spec()
