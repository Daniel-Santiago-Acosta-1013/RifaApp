data "aws_region" "current" {}

resource "aws_apigatewayv2_api" "http" {
  name          = "${var.name_prefix}-http-api"
  protocol_type = "HTTP"
  tags          = var.tags

  dynamic "cors_configuration" {
    for_each = var.enable_cors ? [1] : []
    content {
      allow_origins = var.cors_allow_origins
      allow_headers = var.cors_allow_headers
      allow_methods = var.cors_allow_methods
    }
  }
}

resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = var.api_stage_name
  auto_deploy = true
  tags        = var.tags
}

resource "aws_ses_email_identity" "cognito" {
  count = local.has_cognito_email_identity ? 1 : 0
  email = var.cognito_email_identity
}

data "archive_file" "cognito_custom_message" {
  type        = "zip"
  source_file = "${path.module}/cognito_custom_message/index.py"
  output_path = "${path.module}/cognito-custom-message.zip"
}

data "aws_iam_policy_document" "cognito_custom_message_assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cognito_custom_message" {
  name               = "${var.name_prefix}-cognito-message-role"
  assume_role_policy = data.aws_iam_policy_document.cognito_custom_message_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "cognito_custom_message_basic" {
  role       = aws_iam_role.cognito_custom_message.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_cloudwatch_log_group" "cognito_custom_message" {
  name              = "/aws/lambda/${var.name_prefix}-cognito-message"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_lambda_function" "cognito_custom_message" {
  function_name    = "${var.name_prefix}-cognito-message"
  role             = aws_iam_role.cognito_custom_message.arn
  runtime          = "python3.14"
  handler          = "index.handler"
  filename         = data.archive_file.cognito_custom_message.output_path
  source_code_hash = data.archive_file.cognito_custom_message.output_base64sha256
  memory_size      = 128
  timeout          = 5

  environment {
    variables = {
      APP_NAME = "RifaApp"
    }
  }

  depends_on = [aws_cloudwatch_log_group.cognito_custom_message]
  tags       = var.tags
}

locals {
  has_cognito_ses_source_arn = var.cognito_ses_source_arn != null && var.cognito_ses_source_arn != ""
  has_cognito_email_identity = var.cognito_email_sending_account == "DEVELOPER" && var.cognito_email_identity != ""
  cognito_ses_source_arn     = local.has_cognito_ses_source_arn ? var.cognito_ses_source_arn : (local.has_cognito_email_identity ? aws_ses_email_identity.cognito[0].arn : null)
  use_cognito_custom_messages = (
    var.cognito_email_sending_account == "DEVELOPER" &&
    local.cognito_ses_source_arn != null
  )
  cognito_email_source_arn = var.cognito_email_sending_account == "DEVELOPER" ? local.cognito_ses_source_arn : null
}

resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = true
    mutable             = true
  }

  password_policy {
    minimum_length                   = var.cognito_password_minimum_length
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = false
    temporary_password_validity_days = 7
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  email_configuration {
    email_sending_account  = var.cognito_email_sending_account
    from_email_address     = var.cognito_from_email_address
    reply_to_email_address = var.cognito_reply_to_email_address
    source_arn             = local.cognito_email_source_arn
  }

  dynamic "lambda_config" {
    for_each = local.use_cognito_custom_messages ? [1] : []
    content {
      custom_message = aws_lambda_function.cognito_custom_message.arn
    }
  }

  tags = var.tags
}

resource "aws_lambda_permission" "allow_cognito_custom_message" {
  count         = local.use_cognito_custom_messages ? 1 : 0
  statement_id  = "AllowExecutionFromCognitoUserPool"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cognito_custom_message.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}

resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${var.name_prefix}-frontend"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_apigatewayv2_authorizer" "cognito_jwt" {
  api_id           = aws_apigatewayv2_api.http.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "${var.name_prefix}-cognito-jwt"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.frontend.id]
    issuer   = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}
