data "archive_file" "lambda_read" {
  type        = "zip"
  source_dir  = local.lambda_read_source_dir
  output_path = "${path.module}/lambda-read.zip"
}

data "archive_file" "lambda_write" {
  type        = "zip"
  source_dir  = local.lambda_write_source_dir
  output_path = "${path.module}/lambda-write.zip"
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
  name               = "${local.name_prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_cloudwatch_log_group" "lambda_read" {
  name              = "/aws/lambda/${local.name_prefix}-read"
  retention_in_days = var.lambda_log_retention
  tags              = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_write" {
  name              = "/aws/lambda/${local.name_prefix}-write"
  retention_in_days = var.lambda_log_retention
  tags              = local.tags
}

resource "aws_lambda_function" "read" {
  function_name    = "${local.name_prefix}-read"
  role             = aws_iam_role.lambda.arn
  runtime          = var.lambda_runtime
  handler          = var.lambda_read_handler
  filename         = data.archive_file.lambda_read.output_path
  source_code_hash = data.archive_file.lambda_read.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      API_GATEWAY_BASE_PATH = local.api_gateway_base_path
      AUTO_MIGRATE          = "false"
      DB_HOST               = aws_rds_cluster.db.reader_endpoint
      DB_READ_HOST          = aws_rds_cluster.db.reader_endpoint
      DB_READ_PORT          = tostring(var.db_port)
      DB_PORT               = tostring(var.db_port)
      DB_NAME               = var.db_name
      DB_USER               = var.db_username
      DB_PASSWORD           = var.db_password
      CORS_ALLOW_ORIGINS    = join(",", var.cors_allow_origins)
      CORS_ALLOW_HEADERS    = join(",", var.cors_allow_headers)
      CORS_ALLOW_METHODS    = join(",", var.cors_allow_methods)
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_read]
  tags       = local.tags
}

resource "aws_lambda_function" "write" {
  function_name    = "${local.name_prefix}-write"
  role             = aws_iam_role.lambda.arn
  runtime          = var.lambda_runtime
  handler          = var.lambda_write_handler
  filename         = data.archive_file.lambda_write.output_path
  source_code_hash = data.archive_file.lambda_write.output_base64sha256
  memory_size      = var.lambda_memory_size
  timeout          = var.lambda_timeout

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      API_GATEWAY_BASE_PATH = local.api_gateway_base_path
      AUTO_MIGRATE          = var.auto_migrate ? "true" : "false"
      DB_HOST               = aws_rds_cluster.db.endpoint
      DB_READ_HOST          = aws_rds_cluster.db.reader_endpoint
      DB_READ_PORT          = tostring(var.db_port)
      DB_PORT               = tostring(var.db_port)
      DB_NAME               = var.db_name
      DB_USER               = var.db_username
      DB_PASSWORD           = var.db_password
      CORS_ALLOW_ORIGINS    = join(",", var.cors_allow_origins)
      CORS_ALLOW_HEADERS    = join(",", var.cors_allow_headers)
      CORS_ALLOW_METHODS    = join(",", var.cors_allow_methods)
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_write]
  tags       = local.tags
}
