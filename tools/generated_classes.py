from typing import Any, Union

class AggregateExpression:
    def __init__(self, agg: str, label: str = None):
        self.agg = agg
        self.label = label


class AggregateTransform:
    def __init__(self, value: Union["Argmax", "Argmin", "Avg", "Count", "Max", "Min", "First", "Last", "Median", "Mode", "Product", "Quantile", "Stddev", "StddevPop", "Sum", "Variance", "VarPop"]):
        self.value = value
