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

  backend_lambda_dir        = "${get_repo_root()}/infra/backend/lambda_dist"
  local_lambda_dir          = "${get_repo_root()}/apps/api/lambda_dist"
  backend_lambda_dir_exists = can(fileset(local.backend_lambda_dir, "*"))
  resolved_lambda_dir       = local.backend_lambda_dir_exists ? local.backend_lambda_dir : local.local_lambda_dir
  lambda_layer_dir          = get_env("TF_VAR_lambda_layer_read_source_dir", "${local.resolved_lambda_dir}/layer-read")
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/lambda_layer"
}

inputs = {
  layer_name          = get_env("LAMBDA_LAYER_READ_NAME", "${local.name_prefix}-deps-read")
  layer_source_dir    = local.lambda_layer_dir
  layer_description   = get_env("LAMBDA_LAYER_DESCRIPTION", "Dependencias compartidas para Lambda read")
  compatible_runtimes = [get_env("LAMBDA_RUNTIME", "python3.11")]
  tags                = local.tags
}
