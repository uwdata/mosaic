"""Helpers for .sql and .data() methods.
"""


def _param_name(value):
    if isinstance(value, str) and value[:1] == "$" and len(value) > 1:
        return value[1:]
    return None


def _is_literal_table(value):
    return isinstance(value, str) and not value.startswith("$")


def collect_table_filters(spec):
    """
    Walk the spec and return a mapping of table names to the param names
    that filter them, used to build the WHERE clause in .sql and .data().
    """
    result = {}

    def visit(node):
        if isinstance(node, dict):
            data = node.get("data")
            if isinstance(data, dict) and _is_literal_table(data.get("from")):
                table = data["from"]
                names = result.setdefault(table, set())
                filter_by = data.get("filterBy")
                candidates = filter_by if isinstance(filter_by, list) else [filter_by]
                for entry in candidates:
                    name = _param_name(entry)
                    if name is not None:
                        names.add(name)
            for value in node.values():
                visit(value)
        elif isinstance(node, list):
            for item in node:
                visit(item)

    visit(spec)
    result = {table: list(names) for table, names in result.items()}
    return result

def resolve_predicates(params, selection_names):
    """
    Return the active SQL predicate strings for the given param names,
    skipping any that are missing or blank.
    """
    predicates = []
    for name in selection_names:
        entry = params.get(name)
        if not isinstance(entry, dict):
            continue
        predicate = entry.get("predicate")
        if isinstance(predicate, str) and predicate.strip():
            predicates.append(predicate)
    return predicates
