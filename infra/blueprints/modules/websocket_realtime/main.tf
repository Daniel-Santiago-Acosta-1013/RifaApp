data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  lambda_name                 = "${var.name_prefix}-realtime"
  websocket_api_name          = "${var.name_prefix}-realtime-ws"
  websocket_stage_path        = var.api_stage_name == "$default" ? "" : "/${var.api_stage_name}"
  websocket_client_url        = "${aws_apigatewayv2_api.websocket.api_endpoint}${local.websocket_stage_path}"
  websocket_management_url    = "${replace(aws_apigatewayv2_api.websocket.api_endpoint, "wss://", "https://")}${local.websocket_stage_path}"
  manage_connections_resource = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*/@connections/*"
}

data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.lambda_source_dir
  output_path = "${path.module}/${local.lambda_name}.zip"
}

resource "aws_dynamodb_table" "connections" {
  name         = "${var.name_prefix}-realtime-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connection_id"

  attribute {
    name = "connection_id"
    type = "S"
  }

  attribute {
    name = "raffle_id"
    type = "S"
  }

  global_secondary_index {
    name            = "raffle_id-index"
    hash_key        = "raffle_id"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = merge(var.tags, { Name = "${var.name_prefix}-realtime-connections" })
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${local.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_realtime" {
  name = "${local.lambda_name}-realtime"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.connections.arn
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.lambda_name}"
  retention_in_days = var.lambda_log_retention
  tags              = var.tags
}

resource "aws_lambda_function" "lambda" {
  function_name    = local.lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = var.lambda_runtime
  handler          = var.lambda_handler
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  layers           = var.layer_arns

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = var.tags
}

resource "aws_apigatewayv2_api" "websocket" {
  name                       = local.websocket_api_name
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
  tags                       = var.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.websocket.id
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.lambda.invoke_arn
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = toset(["$connect", "$disconnect", "subscribe", "$default"])

  api_id    = aws_apigatewayv2_api.websocket.id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.websocket.id
  name        = var.api_stage_name
  auto_deploy = true
  tags        = var.tags
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvokeRealtime"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket.execution_arn}/*/*"
}
