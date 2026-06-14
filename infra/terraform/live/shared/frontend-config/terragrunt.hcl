include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  project_name = get_env("PROJECT_NAME", "rifaapp")
  environment  = get_env("ENVIRONMENT", "dev")
  tags = {
    Project     = local.project_name
    Environment = local.environment
  }
}

dependency "api" {
  config_path                             = "../api"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs_merge_strategy_with_state  = "shallow"
  mock_outputs = {
    api_invoke_url              = "https://example.com"
    cognito_user_pool_id        = "us-east-1_mock"
    cognito_user_pool_client_id = "mockclient"
    cognito_region              = "us-east-1"
  }
}

dependency "realtime" {
  config_path                             = "../realtime"
  mock_outputs_allowed_terraform_commands = ["destroy"]
  mock_outputs_merge_strategy_with_state  = "shallow"
  mock_outputs = {
    websocket_client_url = "wss://example.com"
  }
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/frontend_config"
}

inputs = {
  project_name                = local.project_name
  environment                 = local.environment
  api_invoke_url              = dependency.api.outputs.api_invoke_url
  realtime_websocket_url      = dependency.realtime.outputs.websocket_client_url
  cognito_user_pool_id        = dependency.api.outputs.cognito_user_pool_id
  cognito_user_pool_client_id = dependency.api.outputs.cognito_user_pool_client_id
  cognito_region              = dependency.api.outputs.cognito_region
  tags                        = local.tags
}
