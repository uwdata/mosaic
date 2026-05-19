import vgplot as vg

meta = vg.meta(
    title="Linear Regression",
    description="A linear regression plot predicting athletes' heights based on their weights. Regression computation is performed in the database. The area around a regression line shows a 95% confidence interval. Select a region to view regression results for a data subset.\n",
)
athletes = vg.parquet("data/athletes.parquet")

query = vg.selection.intersect()

view = vg.plot(
    vg.dot(athletes, x="weight", y="height", fill="sex", r=2, opacity=0.05),
    vg.regression_y(
        data="athletes", filter_by=query, x="weight", y="height", stroke="sex"
    ),
    vg.interval_xy(bind=query, brush=vg.brush(fill_opacity=0, stroke="currentColor")),
    vg.xy_domain("Fixed"),
    vg.color_domain("Fixed"),
)

spec = vg.spec()
