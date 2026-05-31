data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = var.lambda_source_dir
  output_path = "${path.module}/${var.lambda_name}.zip"
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
  name               = "${var.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_secrets" {
  count = var.db_secret_arn != "" ? 1 : 0
  name  = "${var.lambda_name}-secrets"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue"]
        Resource = var.db_secret_arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_realtime" {
  count = var.realtime_connections_table_arn != "" && var.realtime_websocket_execution_arn != "" ? 1 : 0
  name  = "${var.lambda_name}-realtime"
  role  = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:DeleteItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          var.realtime_connections_table_arn,
          "${var.realtime_connections_table_arn}/index/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["execute-api:ManageConnections"]
        Resource = "${var.realtime_websocket_execution_arn}/*/*/@connections/*"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.lambda_name}"
  retention_in_days = var.lambda_log_retention
  tags              = var.tags
}

resource "aws_lambda_function" "lambda" {
  function_name    = var.lambda_name
  role             = aws_iam_role.lambda.arn
  runtime          = var.lambda_runtime
  handler          = var.lambda_handler
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout
  layers           = var.layer_arns

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = var.security_group_ids
  }

  environment {
    variables = merge(
      var.environment,
      var.db_secret_arn != "" ? { DB_SECRET_ARN = var.db_secret_arn } : {}
    )
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
  tags       = var.tags
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = var.api_id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.lambda.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "routes" {
  for_each = toset(var.route_keys)

  api_id    = var.api_id
  route_key = each.value
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke-${var.lambda_name}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_execution_arn}/*/*"
}
