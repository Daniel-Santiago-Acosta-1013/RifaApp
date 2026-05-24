include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  project_name = get_env("PROJECT_NAME", "rifaapp")
  environment  = get_env("ENVIRONMENT", "dev")
  name_prefix  = "${local.project_name}-${local.environment}"
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
  cors_allow_headers = split(",", get_env("CORS_ALLOW_HEADERS", "*"))
  cors_allow_methods = split(",", get_env("CORS_ALLOW_METHODS", "GET,POST,PUT,PATCH,DELETE,OPTIONS"))
}
