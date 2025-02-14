from generated_classes import *

Spec(
    {
        "params": Params(
            "click": ParamDefinition(
                Selection("single")
            ),
            "domain": ParamDefinition(
                ParamValue([
                    ParamLiteral("sun"),
                    ParamLiteral("fog"),
                    ParamLiteral("drizzle"),
                    ParamLiteral("rain"),
                    ParamLiteral("snow")
                ])
            ),
            "colors": ParamDefinition(
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
                HConcat(Component(
                    Plot([
                        PlotMark(
                            Dot(
                                PlotMarkData(
                                    PlotFrom(
                                        ParamRef("click"),
                                        _from="weather"
                                    )
                                ),
                                mark: "dot",
                                x=ChannelValueSpec({
                                    "dateMonthDay": "date"
                                }),
                                y=ChannelValueSpec(
                                    ChannelValue("temp_max")
                                ),
                                fill=ChannelValueSpec(
                                    ChannelValue("weather")
                                ),
                                r=ChannelValueSpec(
                                    ChannelValue("precipitation")
                                ),
                                opacity=ChannelValueSpec(
                                    ChannelValue(0.7)
                                )
                            )
                            PlotInteractor(IntervalX(select="intervalX", as_=ParamRef("range"))),
                            PlotInteractor(IntervalX(select="highlight", by="$range", fill="#eee"),
                            PlotLegend(legend="color", as_="$click", columns=1)
                        )
                    ])
                ))
            )
        ])
    }
)