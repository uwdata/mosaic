from .utils import _todict, revert_validation

class SchemaBase:

    def to_dict(self, keep_none_values: bool):
        class_dictionary = {}
        for field, value in vars(self).items():
            field = revert_validation(field)
            print(f"working with field: {field}, val: {value}")
            val_as_dict = str(value) # Default value

            if isinstance(value, dict):
                val_as_dict = {revert_validation(k): _todict(v) for k, v in value.items() if keep_none_values or v is not None}
            elif isinstance(value, list):
                val_as_dict = [_todict(i) for i in value if keep_none_values or i is not None]
            elif hasattr(value, '__dict__'):
                val_as_dict = value.__dict__
                if len(val_as_dict.keys()) == 1:
                    val_as_dict = _todict(list(val_as_dict.values())[0])
                else:
                    val_as_dict = {revert_validation(k): _todict(v) for k, v in val_as_dict.items() if keep_none_values or v is not None}
            elif isinstance(value, (str, int, float, bool)):
                val_as_dict = value
            elif value is None:
                val_as_dict = None

            if keep_none_values or val_as_dict is not None:
                class_dictionary[field] = val_as_dict

        if not class_dictionary:
            return None
        return class_dictionary
