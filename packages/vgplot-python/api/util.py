from typing import Any, Dict


def camelize(key: str) -> str:
    """Convert snake_case to lowerCamelCase."""
    if not key:
        return key
    parts = key.split("_")
    return parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])


def omit_none(d: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy without None values."""
    return {k: v for k, v in d.items() if v is not None}
