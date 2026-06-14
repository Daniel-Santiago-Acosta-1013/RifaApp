include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "lambda_layer" {
  config_path                             = "../lambda-layer-write"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs_merge_strategy_with_state  = "shallow"
  mock_outputs = {
    layer_arn = "arn:aws:lambda:us-east-1:000000000000:layer:mock:1"
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
  lambda_realtime_dir       = get_env("TF_VAR_lambda_realtime_source_dir", "${local.resolved_lambda_dir}/realtime")
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/websocket_realtime"
}

inputs = {
  name_prefix          = local.name_prefix
  lambda_source_dir    = local.lambda_realtime_dir
  lambda_handler       = get_env("LAMBDA_REALTIME_HANDLER", "rifaapp.realtime.handler.handler")
  lambda_runtime       = get_env("LAMBDA_RUNTIME", "python3.14")
  lambda_memory_size   = tonumber(get_env("LAMBDA_MEMORY_SIZE", "1024"))
  lambda_timeout       = tonumber(get_env("LAMBDA_TIMEOUT", "30"))
  lambda_log_retention = tonumber(get_env("LAMBDA_LOG_RETENTION", "14"))
  layer_arns           = [dependency.lambda_layer.outputs.layer_arn]
  api_stage_name       = get_env("TF_VAR_api_stage_name", get_env("API_STAGE_NAME", "$default"))
  tags                 = local.tags
}
