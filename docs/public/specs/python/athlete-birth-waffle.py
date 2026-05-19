import vgplot as vg

meta = vg.meta(
    title="Athlete Birth Waffle",
    description="Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.\n",
    credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit).",
)
data = vg.data(athletes=vg.parquet("data/athletes.parquet"))

unit = vg.param(10)
round = vg.param(False)
gap = vg.param(1)
radius = vg.param(0)

view = vg.vconcat(
    vg.hconcat(
        vg.menu(bind=unit, options=[1, 2, 5, 10, 25, 50, 100], label="Unit"),
        vg.menu(bind=round, options=[True, False], label="Round"),
        vg.menu(bind=gap, options=[0, 1, 2, 3, 4, 5], label="Gap"),
        vg.slider(bind=radius, min=0, max=10, step=0.1, label="Radius"),
    ),
    vg.vspace(10),
    vg.plot(
        vg.waffle_y(
            data="athletes",
            unit=unit,
            round=round,
            gap=gap,
            rx=radius,
            x=vg.sql('5 * floor(year("date_of_birth") / 5)'),
            y=vg.count(),
        ),
        vg.x_label(None),
        vg.x_tick_size(0),
        vg.x_tick_format("d"),
    ),
)

spec = vg.spec(meta, data, view)
