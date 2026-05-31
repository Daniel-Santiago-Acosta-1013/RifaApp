from __future__ import annotations

import json
import os
import time
from typing import Any

import boto3

_dynamodb = None


def _table():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb.Table(os.environ["CONNECTIONS_TABLE"])


def _response(status_code: int, body: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        "statusCode": status_code,
        "body": json.dumps(body or {}),
    }


def _connection_id(event: dict[str, Any]) -> str:
    return event.get("requestContext", {}).get("connectionId", "")


def _json_body(event: dict[str, Any]) -> dict[str, Any]:
    raw_body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        return {}
    try:
        value = json.loads(raw_body)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def _connect(event: dict[str, Any]) -> dict[str, Any]:
    connection_id = _connection_id(event)
    if not connection_id:
        return _response(400, {"message": "Missing connection id"})

    now = int(time.time())
    _table().put_item(
        Item={
            "connection_id": connection_id,
            "connected_at": now,
            "ttl": now + 86400,
        }
    )
    return _response(200, {"status": "connected"})


def _disconnect(event: dict[str, Any]) -> dict[str, Any]:
    connection_id = _connection_id(event)
    if connection_id:
        _table().delete_item(Key={"connection_id": connection_id})
    return _response(200, {"status": "disconnected"})


def _subscribe(event: dict[str, Any]) -> dict[str, Any]:
    connection_id = _connection_id(event)
    body = _json_body(event)
    raffle_id = str(body.get("raffle_id") or "").strip()
    if not connection_id or not raffle_id:
        return _response(400, {"message": "connection_id and raffle_id are required"})

    now = int(time.time())
    _table().put_item(
        Item={
            "connection_id": connection_id,
            "raffle_id": raffle_id,
            "connected_at": now,
            "ttl": now + 86400,
        }
    )
    return _response(200, {"status": "subscribed", "raffle_id": raffle_id})


def handler(event: dict[str, Any], _context: Any) -> dict[str, Any]:
    route_key = event.get("requestContext", {}).get("routeKey")
    if route_key == "$connect":
        return _connect(event)
    if route_key == "$disconnect":
        return _disconnect(event)
    if route_key == "subscribe":
        return _subscribe(event)
    return _response(200, {"status": "ignored"})
