from schema_wrapper.utils import _todict, revert_validation


class SchemaBase:
    def __init__(self):
        pass

    def to_dict(self, keep_none_values: bool = False):
        class_dictionary = {}

        for field, value in vars(self).items():
            if field == "additional_params":
                additional_parameter_dict = {k: _todict(v, keep_none_values) for k, v in value.items()}
                # The dictionaries shouldn't have any overlapping keys
                class_dictionary.update(additional_parameter_dict)
                continue
            field = revert_validation(field)
            if value is Ellipsis:
                continue

            val_as_dict = str(value)  # Default value

            if isinstance(value, dict):
                #if len(value.keys()) == 1:
                #    val_as_dict = _todict(list(value.values())[0], keep_none_values)
                #else:
                val_as_dict = {
                    revert_validation(k): _todict(v, keep_none_values)
                    for k, v in value.items()
                    if v is not Ellipsis and (keep_none_values or v is not None)
                }
            elif isinstance(value, list):
                val_as_dict = [
                    _todict(i, keep_none_values)
                    for i in value
                    if i is not Ellipsis and (keep_none_values or i is not None)
                ]
            elif hasattr(value, "__dict__"):
                val_as_dict = value.__dict__
                if len(val_as_dict.keys()) == 1:
                    val_as_dict = _todict(list(val_as_dict.values())[0], keep_none_values)
                else:
                    val_as_dict = {
                        revert_validation(k): _todict(v, keep_none_values)
                        for k, v in val_as_dict.items()
                        if v is not Ellipsis and (keep_none_values or v is not None)
                    }
            elif isinstance(value, (str, int, float, bool)):
                val_as_dict = value
            elif value is None:
                val_as_dict = None

            if keep_none_values or val_as_dict is not None:
                class_dictionary[field] = val_as_dict

        if not class_dictionary:
            return None
        elif (
            len(list(class_dictionary.values())) == 1
        ):
            if list(class_dictionary.keys())[0] == "value":
                if self.__class__.__name__ == "Component":
                    if self.value.__class__.__name__ in ["VConcat", "HConcat"]:
                        return {self.value.__class__.__name__.lower(): class_dictionary["value"]}

                return class_dictionary["value"]
            elif list(class_dictionary.keys())[0] == "vconcat":
                return class_dictionary["vconcat"]

        return class_dictionary
