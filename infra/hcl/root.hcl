locals {
  backend = {
    bucket = "rifaapp-terraform-state-745819688993"
    region = "us-east-1"
    key_prefix = "rifaapp"
  }
}

remote_state {
  backend = "s3"
  config = {
    bucket = local.backend.bucket
    key    = "${local.backend.key_prefix}/${path_relative_to_include()}/terraform.tfstate"
    region = local.backend.region
  }
}
