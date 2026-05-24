include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "network" {
  config_path = "../../shared/network"
}

dependency "db" {
  config_path = "../../shared/db"
}

dependency "api" {
  config_path = "../../shared/api"
}

dependency "lambda_layer" {
  config_path = "../../shared/lambda-layer-read"
}

locals {
  project_name = get_env("PROJECT_NAME", "rifaapp")
  environment  = get_env("ENVIRONMENT", "dev")
  name_prefix  = "${local.project_name}-${local.environment}"
  tags = {
    Project     = local.project_name
    Environment = local.environment
  }

  backend_lambda_dir        = "${get_repo_root()}/infra/backend/lambda_dist"
  local_lambda_dir          = "${get_repo_root()}/apps/api/lambda_dist"
  backend_lambda_dir_exists = can(fileset(local.backend_lambda_dir, "*"))
  resolved_lambda_dir       = local.backend_lambda_dir_exists ? local.backend_lambda_dir : local.local_lambda_dir
  lambda_read_dir           = get_env("TF_VAR_lambda_read_source_dir", "${local.resolved_lambda_dir}/read")
  api_stage_name            = get_env("TF_VAR_api_stage_name", get_env("API_STAGE_NAME", "$default"))
  api_gateway_base_path     = local.api_stage_name == "$default" ? "" : "/${local.api_stage_name}"

  read_routes = [
    "ANY /rifa-app-read/{proxy+}",
  ]
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/lambda_api_http"
}

inputs = {
  lambda_name         = "rifa-app-read"
  lambda_source_dir   = local.lambda_read_dir
  lambda_handler      = get_env("LAMBDA_READ_HANDLER", "rifaapp.read.src.entrypoints.api.handler")
  lambda_runtime      = get_env("LAMBDA_RUNTIME", "python3.14")
  lambda_memory_size  = tonumber(get_env("LAMBDA_MEMORY_SIZE", "1024"))
  lambda_timeout      = tonumber(get_env("LAMBDA_TIMEOUT", "30"))
  lambda_log_retention = tonumber(get_env("LAMBDA_LOG_RETENTION", "14"))
  layer_arns          = [dependency.lambda_layer.outputs.layer_arn]
  subnet_ids          = dependency.network.outputs.private_subnet_ids
  security_group_ids  = [dependency.db.outputs.client_security_group_id]
  api_id              = dependency.api.outputs.api_id
  api_execution_arn   = dependency.api.outputs.api_execution_arn
  route_keys          = local.read_routes
  tags                = local.tags
  db_secret_arn       = dependency.db.outputs.db_secret_arn

  environment = {
    API_GATEWAY_BASE_PATH = local.api_gateway_base_path
    API_PREFIX            = "/rifa-app-read"
    AUTO_MIGRATE          = "false"
    DB_HOST               = dependency.db.outputs.db_reader_endpoint
    DB_READ_HOST          = dependency.db.outputs.db_reader_endpoint
    DB_READ_PORT          = tostring(dependency.db.outputs.db_port)
    DB_PORT               = tostring(dependency.db.outputs.db_port)
    DB_NAME               = dependency.db.outputs.db_name
    DB_USER               = dependency.db.outputs.db_username
    CORS_ALLOW_ORIGINS    = get_env("CORS_ALLOW_ORIGINS", "*")
    CORS_ALLOW_HEADERS    = get_env("CORS_ALLOW_HEADERS", "*")
    CORS_ALLOW_METHODS    = get_env("CORS_ALLOW_METHODS", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
  }
}
