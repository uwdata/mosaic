import json
import vgplot as vg

data = vg.data(
    aapl={
    "type": "parquet",
    "file": "data/stocks.parquet",
    "where": "Symbol = 'AAPL'"
}
)

view = vg.plot(
    vg.line_y(data=vg.from_("aapl"), stroke="#ccc", x="Date", y="Close"),
    vg.line_y(data=vg.from_("aapl"), stroke="black", x="Date", y={
        "avg": "Close",
        "orderby": "Date",
        "range": [
        {
        "days": 15
    },
        {
        "days": 15
    }
    ]
    }),
    vg.line_y(data=vg.from_("aapl"), stroke="firebrick", x="Date", y={
        "avg": "Close",
        "orderby": "Date",
        "range": [
        {
        "months": 3
    },
        {
        "months": 3
    }
    ]
    }),
    vg.y_label("Close"),
    vg.width(680),
    vg.height(200)
)

spec = vg.spec(data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))