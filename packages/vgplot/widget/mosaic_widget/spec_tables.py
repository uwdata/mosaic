"""Helpers for extracting table/selection relationships from a Mosaic spec.

These helpers power ``MosaicWidget.sql`` and ``MosaicWidget.data()`` by
discovering which selections are used as ``filterBy`` on which source tables
and by combining the live ``predicate`` strings on the ``params`` traitlet
into a SQL ``WHERE`` clause.
"""


def _param_name(value):
    """Return the param name for a ``$name`` reference, else None."""
    if isinstance(value, str) and value[:1] == "$" and len(value) > 1:
        return value[1:]
    return None


def _is_literal_table(value):
    return isinstance(value, str) and not value.startswith("$")


def collect_table_filters(spec):
    """Walk a Mosaic spec and map each source table to its ``filterBy`` selections.

    Mark ``data`` blocks of the form ``{"from": "<table>", "filterBy": "$sel"}``
    contribute a ``table -> [selection]`` entry. Tables referenced without a
    ``filterBy`` still appear in the result with an empty list. Dynamic ``from``
    values that are param references (``"$tableParam"``) are skipped.

    Selection names are de-duplicated and returned in sorted order.
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
    return result


def resolve_predicates(params, selection_names):
    """Collect non-empty ``predicate`` strings for the given selection names.

    Names without a corresponding entry in ``params``, or whose entry lacks a
    predicate (e.g. a plain Param rather than a Selection), are silently
    skipped. The order of the returned list matches the order of
    ``selection_names``.
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
