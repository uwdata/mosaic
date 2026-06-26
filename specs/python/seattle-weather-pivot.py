import vgplot as vg

seattle_weather = vg.parquet("data/seattle-weather.parquet")
weatherByYear = vg.table(
    "PIVOT (SELECT *, year(date) AS year FROM seattle_weather) ON weather IN ('drizzle', 'fog', 'rain', 'snow', 'sun') USING count(*) GROUP BY year ORDER BY year"
)

view = vg.table_input(
    source=weatherByYear, align={"year": "left"}, width={"year": 80}, height=180
)
