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
  source = "${get_repo_root()}/infra/blueprints/modules/network"
}

inputs = {
  name_prefix          = local.name_prefix
  tags                 = local.tags
  vpc_cidr             = get_env("VPC_CIDR", "10.0.0.0/16")
  public_subnet_cidrs  = split(",", get_env("PUBLIC_SUBNET_CIDRS", "10.0.0.0/24,10.0.1.0/24"))
  private_subnet_cidrs = split(",", get_env("PRIVATE_SUBNET_CIDRS", "10.0.10.0/24,10.0.11.0/24"))
  enable_nat_gateway   = get_env("ENABLE_NAT_GATEWAY", "true") == "true"
}
