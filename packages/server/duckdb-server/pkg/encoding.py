from __future__ import annotations

import re


def response_encoding(header: str) -> tuple[bool, bool]:
    qualities: dict[str, float] = {}
    for entry in header.lower().split(","):
        name, *parameters = entry.strip().split(";")
        if not name:
            continue
        quality = 1.0
        for parameter in parameters:
            key, _, value = parameter.strip().partition("=")
            if key == "q":
                quality = (
                    float(value)
                    if re.fullmatch(r"(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)", value)
                    else 0.0
                )
        qualities[name] = max(qualities.get(name, 0.0), quality)
    gzip = qualities.get("gzip", qualities.get("*", 0.0))
    identity = qualities.get("identity", 0.0 if qualities.get("*") == 0 else 1.0)
    return gzip > 0 and gzip >= identity, identity > 0
