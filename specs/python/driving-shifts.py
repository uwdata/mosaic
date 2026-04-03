import json
import vgplot as vg

meta = vg.meta(title="Driving Shifts into Reverse", description="A connected scatter plot of miles driven vs. gas prices.", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-connected-scatterplot), which in turn adapts Hannah Fairfield's [New York Times article](http://www.nytimes.com/imagepages/2010/05/02/business/02metrics.html).\n")
data = vg.data(
    driving=vg.parquet("data/driving.parquet")
)

view = vg.plot(
    vg.line(data=vg.from_("driving"), x="miles", y="gas", curve="catmull-rom", marker=True),
    vg.text(data=vg.from_("driving"), x="miles", y="gas", text={
        "sql": "year::VARCHAR"
    }, dy=-6, line_anchor="bottom", filter={
        "sql": "year % 5 = 0"
    }),
    vg.inset(10),
    vg.grid(True),
    vg.x_label("Miles driven (per person-year)"),
    vg.y_label("Cost of gasoline ($ per gallon)")
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))