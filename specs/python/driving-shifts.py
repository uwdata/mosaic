import vgplot as vg

driving = vg.parquet("data/driving.parquet")

view = vg.plot(
    vg.line(driving, x="miles", y="gas", curve="catmull-rom", marker=True),
    vg.text(
        driving,
        x="miles",
        y="gas",
        text=vg.sql("year::VARCHAR"),
        dy=-6,
        line_anchor="bottom",
        filter=vg.sql("year % 5 = 0"),
    ),
    vg.inset(10),
    vg.grid(True),
    vg.x_label("Miles driven (per person-year)"),
    vg.y_label("Cost of gasoline ($ per gallon)"),
)

view
