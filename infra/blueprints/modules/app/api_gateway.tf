resource "aws_apigatewayv2_api" "http" {
  name          = "${local.name_prefix}-http-api"
  protocol_type = "HTTP"
  tags          = local.tags

  dynamic "cors_configuration" {
    for_each = var.enable_cors ? [1] : []
    content {
      allow_origins = var.cors_allow_origins
      allow_headers = var.cors_allow_headers
      allow_methods = var.cors_allow_methods
    }
  }
}

resource "aws_apigatewayv2_integration" "read" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.read.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "write" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.write.invoke_arn
  payload_format_version = "2.0"
}

locals {
  read_routes = [
    "GET ${local.api_base_path}",
    "GET ${local.api_base_path}/health",
    "GET ${local.api_base_path}/version",
    "GET ${local.api_base_path}/docs",
    "GET ${local.api_base_path}/openapi.json",
    "GET ${local.api_base_path}/redoc",
    "GET ${local.api_base_path}/raffles",
    "GET ${local.api_base_path}/raffles/{raffle_id}",
    "GET ${local.api_base_path}/raffles/{raffle_id}/numbers",
    "GET ${local.api_base_path}/participants/{participant_id}/purchases",
  ]

  write_routes = [
    "POST ${local.api_base_path}/migrations/run",
    "POST ${local.api_base_path}/auth/register",
    "POST ${local.api_base_path}/auth/login",
    "GET ${local.api_base_path}/wallet",
    "POST ${local.api_base_path}/wallet/deposits",
    "POST ${local.api_base_path}/wallet/reset",
    "POST ${local.api_base_path}/raffles",
    "PATCH ${local.api_base_path}/raffles/{raffle_id}",
    "DELETE ${local.api_base_path}/raffles/{raffle_id}",
    "POST ${local.api_base_path}/raffles/{raffle_id}/reservations",
    "POST ${local.api_base_path}/raffles/{raffle_id}/confirm",
    "POST ${local.api_base_path}/raffles/{raffle_id}/release",
    "POST ${local.api_base_path}/raffles/{raffle_id}/draw",
  ]
}

resource "aws_apigatewayv2_route" "read" {
  for_each = toset(local.read_routes)

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.read.id}"
}

resource "aws_apigatewayv2_route" "write" {
  for_each = toset(local.write_routes)

  api_id    = aws_apigatewayv2_api.http.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.write.id}"
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = var.api_stage_name
  auto_deploy = true
  tags        = local.tags
}

resource "aws_lambda_permission" "apigw_read" {
  statement_id  = "AllowAPIGatewayInvokeRead"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.read.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_write" {
  statement_id  = "AllowAPIGatewayInvokeWrite"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.write.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
