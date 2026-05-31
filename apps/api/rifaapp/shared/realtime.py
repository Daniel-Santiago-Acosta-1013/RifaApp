from __future__ import annotations

import json
import logging
import os
from datetime import datetime
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

_dynamodb = None
_management_api = None


def _json_default(value: Any) -> str:
    if isinstance(value, (datetime, Decimal)):
        return str(value)
    return str(value)


def _connections_table():
    table_name = os.getenv("REALTIME_CONNECTIONS_TABLE", "").strip()
    if not table_name:
        return None
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb.Table(table_name)


def _api_client():
    endpoint = os.getenv("REALTIME_WEBSOCKET_ENDPOINT", "").strip()
    if not endpoint:
        return None
    global _management_api
    if _management_api is None:
        _management_api = boto3.client("apigatewaymanagementapi", endpoint_url=endpoint)
    return _management_api


def publish_raffle_numbers_changed(
    *,
    raffle_id: str,
    event: str,
    numbers: list[int],
    status: str,
    reserved_until: Any | None = None,
    reservation_id: str | None = None,
    purchase_id: str | None = None,
) -> None:
    table = _connections_table()
    api_client = _api_client()
    if table is None or api_client is None:
        return

    payload = {
        "type": "raffle_numbers_changed",
        "raffle_id": raffle_id,
        "event": event,
        "numbers": sorted(numbers),
        "status": status,
        "reserved_until": reserved_until,
        "reservation_id": reservation_id,
        "purchase_id": purchase_id,
    }
    data = json.dumps(payload, default=_json_default).encode("utf-8")

    try:
        response = table.query(
            IndexName="raffle_id-index",
            KeyConditionExpression=Key("raffle_id").eq(raffle_id),
        )
    except ClientError:
        logger.exception("Could not query realtime subscribers for raffle %s", raffle_id)
        return

    for item in response.get("Items", []):
        connection_id = item.get("connection_id")
        if not connection_id:
            continue
        try:
            api_client.post_to_connection(ConnectionId=connection_id, Data=data)
        except api_client.exceptions.GoneException:
            table.delete_item(Key={"connection_id": connection_id})
        except ClientError:
            logger.exception("Could not publish realtime event to %s", connection_id)
