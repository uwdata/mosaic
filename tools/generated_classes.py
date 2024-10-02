from typing import Any, Union
class AggregateExpression:
    def __init__(self, agg: str, label: str = None):
        self.agg = agg
        self.label = label
class ParamRef:
    def __init__(self):
        pass
    
class TransformField:
    def __init__(self, value: Union["str", "ParamRef"]):
        self.value = value

class AggregateTransform:
    def __init__(self, value: Union["Argmax", "Argmin", "Avg", "Count", "Max", "Min", "First", "Last", "Median", "Mode", "Product", "Quantile", "Stddev", "StddevPop", "Sum", "Variance", "VarPop"]):
        self.value = value

class Argmax:
    def __init__(self, argmax: Any, distinct: bool = None, orderby: Union[TransformField, Any] = None, partitionby: Union[TransformField, Any] = None, range: Union[Any, ParamRef] = None, rows: Union[Any, ParamRef] = None):
        self.argmax = argmax
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows

class Argmin:
    def __init__(self, argmin: Any, distinct: bool = None, orderby: Union[TransformField, Any] = None, partitionby: Union[TransformField, Any] = None, range: Union[Any, ParamRef] = None, rows: Union[Any, ParamRef] = None):
        self.argmin = argmin
        self.distinct = distinct
        self.orderby = orderby
        self.partitionby = partitionby
        self.range = range
        self.rows = rows


