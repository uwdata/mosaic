import vgplot as vg

meta = vg.meta(
    title="Region Interactor Tests",
    descriptions="Varied plots using region interactors to highlight selected values.\n",
)
data = vg.data(
    bls_unemp=vg.parquet("data/bls-metro-unemployment.parquet"),
    feed=vg.spatial("data/usgs-feed.geojson"),
    world=vg.spatial("data/countries-110m.json", layer="land"),
    counties=vg.spatial("data/us-counties-10m.json", layer="counties"),
)

series = vg.selection.single()
quakes = vg.selection.single()
counties = vg.selection.single()

view = vg.vconcat(
    vg.plot(
        vg.rule_y(data=[0]),
        vg.line_y(
            data="bls_unemp",
            optimize=False,
            x="date",
            y="unemployment",
            z="division",
            stroke="steelblue",
            stroke_opacity=0.9,
            curve="monotone-x",
        ),
        vg.region(channels=["z"], bind=series),
        vg.highlight(by=series),
        vg.margin_left(24),
        vg.x_label(None),
        vg.x_ticks(10),
        vg.x_line(True),
        vg.y_line(True),
        vg.y_label("Unemployment (%)"),
        vg.y_grid(True),
        vg.margin_right(0),
    ),
    vg.vspace(10),
    vg.plot(
        vg.geo(data="world", fill="currentColor", fill_opacity=0.2),
        vg.sphere(stroke_width=0.5),
        vg.geo(
            data="feed",
            channels=vg.channels(id="id"),
            r=vg.sql("POW(10, mag)"),
            stroke="red",
            fill="red",
            fill_opacity=0.2,
            title="title",
            href="url",
            target="_blank",
        ),
        vg.region(channels=["id"], bind=quakes),
        vg.highlight(by=quakes),
        vg.margin(2),
        vg.projection_type("equirectangular"),
    ),
    vg.vspace(10),
    vg.plot(
        vg.geo(
            data="counties",
            channels=vg.channels(id="id"),
            stroke="currentColor",
            stroke_width=0.25,
        ),
        vg.region(channels=["id"], bind=counties),
        vg.highlight(by=counties),
        vg.margin(0),
        vg.projection_type("albers"),
    ),
)

spec = vg.spec(meta, data, view)
