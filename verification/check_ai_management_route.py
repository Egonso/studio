#!/usr/bin/env python3

from __future__ import annotations

import sys
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


ROUTE_PATH = "/ai-management"
FAILURE_MARKERS = (
    "The default export is not a React Component",
    "Internal Server Error",
)


def main() -> int:
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:9002"
    url = f"{base_url.rstrip('/')}{ROUTE_PATH}"

    try:
        with urlopen(url) as response:
            status = response.getcode()
            body = response.read().decode("utf-8", errors="replace")
    except HTTPError as error:
        print(f"{url} -> HTTP {error.code}")
        return 1
    except URLError as error:
        print(f"{url} -> request failed: {error.reason}")
        return 1

    if status != 200:
        print(f"{url} -> unexpected status {status}")
        return 1

    for marker in FAILURE_MARKERS:
        if marker in body:
            print(f"{url} -> failure marker detected: {marker}")
            return 1

    print(f"{url} -> OK (HTTP 200, no route-contract failure marker)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
