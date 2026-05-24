include "root" {
  path = find_in_parent_folders("root.hcl")
}

locals {
  backend_lambda_dir        = "${get_repo_root()}/infra/backend/lambda_dist"
  local_lambda_dir          = "${get_repo_root()}/apps/api/lambda_dist"
  backend_lambda_dir_exists = can(fileset(local.backend_lambda_dir, "*"))
  resolved_lambda_dir       = local.backend_lambda_dir_exists ? local.backend_lambda_dir : local.local_lambda_dir
  resolved_lambda_read_dir  = "${local.resolved_lambda_dir}/read"
  resolved_lambda_write_dir = "${local.resolved_lambda_dir}/write"
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/app"

  extra_arguments "tfvars" {
    commands = get_terraform_commands_that_need_vars()
    optional_var_files = [
      "${get_terragrunt_dir()}/terraform.tfvars",
    ]
  }
}

inputs = {
  aws_region              = get_env("AWS_REGION", "us-east-1")
  project_name            = "rifaapp"
  environment             = "dev"
  api_base_path           = get_env("TF_VAR_api_base_path", "rifaapp")
  auto_migrate            = true
  lambda_read_source_dir  = get_env("TF_VAR_lambda_read_source_dir", local.resolved_lambda_read_dir)
  lambda_write_source_dir = get_env("TF_VAR_lambda_write_source_dir", local.resolved_lambda_write_dir)
}
