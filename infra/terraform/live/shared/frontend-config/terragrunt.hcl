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
  config_path = "../api"
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/frontend_config"
}

inputs = {
  project_name   = local.project_name
  environment    = local.environment
  api_invoke_url = dependency.api.outputs.api_invoke_url
  tags           = local.tags
}
