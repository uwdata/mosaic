from generated_classes import *

Spec(
    {
        "params": Params(
            click=ParamDefinition(
                Selection("single")
            ),
            domain=ParamDefinition(
                ParamValue([
                    ParamLiteral("sun"),
                    ParamLiteral("fog"),
                    ParamLiteral("drizzle"),
                    ParamLiteral("rain"),
                    ParamLiteral("snow")
                ])
            ),
            colors=ParamDefinition(
                ParamValue([
                    ParamLiteral("#e7ba52"),
                    ParamLiteral("#a7a7a7"),
                    ParamLiteral("#aec7e8"),
                    ParamLiteral("#1f77b4"),
                    ParamLiteral("#9467bd")
                ])
            )
        ),
        "vconcat": VConcat([
            Component(
                HConcat([
                    Component(
                        Plot(
                            plot=[
                                PlotMark(
                                    Dot(
                                        PlotMarkData(
                                            PlotFrom(
                                                ParamRef("click"),
                                                from_="weather"
                                            )
                                        ),
                                        mark="dot",
                                        x=ChannelValueSpec({"dateMonthDay": "date"}),
                                        y=ChannelValueSpec(ChannelValue("temp_max")),
                                        fill=ChannelValueSpec(ChannelValue("weather")),
                                        r=ChannelValueSpec(ChannelValue("precipitation")),
                                        opacity=ChannelValueSpec(ChannelValue(0.7))
                                    ),
                                ),
                                PlotInteractor(IntervalX(select="intervalX", as_=ParamRef("$range"))),
                                PlotInteractor(Highlight(select="highlight", by="$range", fill="#eee")),
                                PlotLegend(legend="color", as_="$click", columns=1)
                            ],
                            xyDomain=Fixed("Fixed"),
                            xTickFormat="%b",
                            colorDomain="$domain",
                            colorRange="$colors",
                            rDomain=Fixed("Fixed"),
                            rRange=[2, 10],
                            width=800
                        )
                    )
                ])
            ),
            Component(
                Plot(
                    plot=[
                        PlotMark(
                            BarX(
                                data=PlotMarkData(PlotFrom(from_="weather")),
                                mark="barX",
                                x=ChannelValueSpec({"count": None}),
                                y=ChannelValueSpec(ChannelValue("weather")),
                                fill=ChannelValueSpec(ChannelValue("#f5f5f5"))
                            )
                        ),
                        PlotMark(
                            BarX(
                                data=PlotMarkData(PlotFrom(from_="weather", filterBy="$range")),
                                mark="barX",
                                x=ChannelValueSpec({"count": None}),
                                y="weather",
                                fill="weather",
                                order="weather"
                            )
                        ),
                        PlotInteractor(IntervalX(select="toggleY", as_=ParamRef("$click"))),
                        PlotInteractor(Highlight(by=ParamRef("$click"), select="highlight"))
                    ],
                    xDomain=Fixed("Fixed"),
                    yDomain=ParamRef("$domain"),
                    yLabel=None,
                    colorDomain=Fixed("Fixed"),
                    colorRange=ParamRef("$colors"),
                    width=800
                )
            )
        ])
    }
)