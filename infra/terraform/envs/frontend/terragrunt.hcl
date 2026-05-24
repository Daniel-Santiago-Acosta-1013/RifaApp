locals {
  backend = {
    bucket = "rifaapp-terraform-state-745819688993"
    key    = "rifaapp/frontend/terraform.tfstate"
    region = "us-east-1"
  }
}

remote_state {
  backend = "s3"
  config = {
    bucket = local.backend.bucket
    key    = local.backend.key
    region = local.backend.region
  }
}

terraform {
  source = "${get_repo_root()}/infra/blueprints/modules/frontend"

  extra_arguments "tfvars" {
    commands = get_terraform_commands_that_need_vars()
    optional_var_files = [
      "${get_terragrunt_dir()}/terraform.tfvars",
    ]
  }
}

inputs = {
  aws_region           = get_env("AWS_REGION", "us-east-1")
  project_name         = "rifaapp"
  environment          = "dev"
  frontend_bucket_name = get_env("TF_VAR_frontend_bucket_name", "")
  frontend_force_destroy = get_env("TF_VAR_frontend_force_destroy", "false") == "true"
  frontend_price_class = get_env("TF_VAR_frontend_price_class", "PriceClass_100")
}
