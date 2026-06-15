include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  project_name                    = get_env("PROJECT_NAME", "rifaapp")
  environment                     = get_env("ENVIRONMENT", "dev")
  ses_source_arn                  = get_env("COGNITO_SES_SOURCE_ARN", "")
  from_email                      = get_env("COGNITO_FROM_EMAIL_ADDRESS", "")
  reply_to_email                  = get_env("COGNITO_REPLY_TO_EMAIL_ADDRESS", "")
  requested_email_sending_account = get_env("COGNITO_EMAIL_SENDING_ACCOUNT", "")
  default_email_sending_account   = "COGNITO_DEFAULT"
  email_sending_account           = local.requested_email_sending_account == "" ? local.default_email_sending_account : local.requested_email_sending_account
  use_developer_email             = local.email_sending_account == "DEVELOPER"
  name_prefix                     = "${local.project_name}-${local.environment}"
  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/api"
}

inputs = {
  name_prefix        = local.name_prefix
  tags               = local.tags
  api_stage_name     = get_env("TF_VAR_api_stage_name", get_env("API_STAGE_NAME", "$default"))
  enable_cors        = get_env("ENABLE_CORS", "true") == "true"
  cors_allow_origins = split(",", get_env("CORS_ALLOW_ORIGINS", "*"))
  cors_allow_headers = split(",", get_env("CORS_ALLOW_HEADERS", "Content-Type,Authorization"))
  cors_allow_methods = split(",", get_env("CORS_ALLOW_METHODS", "GET,POST,PUT,PATCH,DELETE,OPTIONS"))

  cognito_email_identity          = local.use_developer_email ? get_env("COGNITO_SES_EMAIL_IDENTITY", "") : ""
  cognito_ses_source_arn          = local.use_developer_email && local.ses_source_arn != "" ? local.ses_source_arn : null
  cognito_from_email_address      = local.use_developer_email && local.from_email != "" ? local.from_email : null
  cognito_reply_to_email_address  = local.use_developer_email && local.reply_to_email != "" ? local.reply_to_email : null
  cognito_email_sending_account   = local.email_sending_account
  cognito_password_minimum_length = tonumber(get_env("COGNITO_PASSWORD_MINIMUM_LENGTH", "8"))
}
