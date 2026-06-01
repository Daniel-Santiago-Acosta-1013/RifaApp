include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "network" {
  config_path                             = "../../shared/network"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs = {
    private_subnet_ids = ["subnet-00000000000000000"]
  }
}

dependency "db" {
  config_path                             = "../../shared/db"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs = {
    client_security_group_id = "sg-00000000000000000"
    db_cluster_endpoint      = "localhost"
    db_reader_endpoint       = "localhost"
    db_port                  = 5432
    db_name                  = "rifaapp"
    db_username              = "appuser"
    db_secret_arn            = "arn:aws:secretsmanager:us-east-1:000000000000:secret:mock"
  }
}

dependency "api" {
  config_path                             = "../../shared/api"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs = {
    api_id                    = "mock-api"
    api_execution_arn         = "arn:aws:execute-api:us-east-1:000000000000:mock-api"
    cognito_jwt_authorizer_id = "mock-authorizer"
  }
}

dependency "lambda_layer" {
  config_path                             = "../../shared/lambda-layer-write"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs = {
    layer_arn = "arn:aws:lambda:us-east-1:000000000000:layer:mock:1"
  }
}

dependency "realtime" {
  config_path                             = "../../shared/realtime"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs = {
    connections_table_name        = "mock-realtime-connections"
    connections_table_arn         = "arn:aws:dynamodb:us-east-1:000000000000:table/mock-realtime-connections"
    websocket_execution_arn       = "arn:aws:execute-api:us-east-1:000000000000:mock-ws"
    websocket_management_endpoint = "https://example.com"
  }
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
  lambda_write_dir          = get_env("TF_VAR_lambda_write_source_dir", "${local.resolved_lambda_dir}/write")
  api_stage_name            = get_env("TF_VAR_api_stage_name", get_env("API_STAGE_NAME", "$default"))
  api_gateway_base_path     = local.api_stage_name == "$default" ? "" : "/${local.api_stage_name}"

  public_write_routes = [
    "GET /rifa-app-write/health",
    "GET /rifa-app-write/docs",
    "GET /rifa-app-write/openapi.json",
    "GET /rifa-app-write/redoc",
    "POST /rifa-app-write/migrations/run",
    "POST /rifa-app-write/raffles/{raffle_id}/reservations",
    "POST /rifa-app-write/raffles/{raffle_id}/confirm",
    "POST /rifa-app-write/raffles/{raffle_id}/release",
  ]

  protected_write_routes = [
    "GET /rifa-app-write/auth/me",
    "POST /rifa-app-write/raffles",
    "PATCH /rifa-app-write/raffles/{raffle_id}",
    "DELETE /rifa-app-write/raffles/{raffle_id}",
    "POST /rifa-app-write/raffles/{raffle_id}/draw",
  ]
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/lambda_api_http"
}

inputs = {
  lambda_name                      = "rifa-app-write"
  lambda_source_dir                = local.lambda_write_dir
  lambda_handler                   = get_env("LAMBDA_WRITE_HANDLER", "rifaapp.write.src.entrypoints.api.handler")
  lambda_runtime                   = get_env("LAMBDA_RUNTIME", "python3.14")
  lambda_memory_size               = tonumber(get_env("LAMBDA_MEMORY_SIZE", "1024"))
  lambda_timeout                   = tonumber(get_env("LAMBDA_TIMEOUT", "30"))
  lambda_log_retention             = tonumber(get_env("LAMBDA_LOG_RETENTION", "14"))
  layer_arns                       = [dependency.lambda_layer.outputs.layer_arn]
  subnet_ids                       = dependency.network.outputs.private_subnet_ids
  security_group_ids               = [dependency.db.outputs.client_security_group_id]
  api_id                           = dependency.api.outputs.api_id
  api_execution_arn                = dependency.api.outputs.api_execution_arn
  route_keys                       = local.public_write_routes
  protected_route_keys             = local.protected_write_routes
  jwt_authorizer_id                = dependency.api.outputs.cognito_jwt_authorizer_id
  tags                             = local.tags
  db_secret_arn                    = dependency.db.outputs.db_secret_arn
  realtime_connections_table_arn   = dependency.realtime.outputs.connections_table_arn
  realtime_websocket_execution_arn = dependency.realtime.outputs.websocket_execution_arn

  environment = {
    API_GATEWAY_BASE_PATH       = local.api_gateway_base_path
    API_PREFIX                  = "/rifa-app-write"
    AUTO_MIGRATE                = "false"
    DB_HOST                     = dependency.db.outputs.db_cluster_endpoint
    DB_READ_HOST                = dependency.db.outputs.db_reader_endpoint
    DB_READ_PORT                = tostring(dependency.db.outputs.db_port)
    DB_PORT                     = tostring(dependency.db.outputs.db_port)
    DB_NAME                     = dependency.db.outputs.db_name
    DB_USER                     = dependency.db.outputs.db_username
    REALTIME_CONNECTIONS_TABLE  = dependency.realtime.outputs.connections_table_name
    REALTIME_WEBSOCKET_ENDPOINT = dependency.realtime.outputs.websocket_management_endpoint
    CORS_ALLOW_ORIGINS          = get_env("CORS_ALLOW_ORIGINS", "*")
    CORS_ALLOW_HEADERS          = get_env("CORS_ALLOW_HEADERS", "*")
    CORS_ALLOW_METHODS          = get_env("CORS_ALLOW_METHODS", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
  }
}
