include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "network" {
  config_path = "../network"
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
  source = "${get_repo_root()}/infra/blueprints/modules/db"
}

inputs = {
  name_prefix            = local.name_prefix
  tags                   = local.tags
  vpc_id                 = dependency.network.outputs.vpc_id
  private_subnet_ids     = dependency.network.outputs.private_subnet_ids
  db_engine              = get_env("DB_ENGINE", "aurora-postgresql")
  db_engine_version      = get_env("DB_ENGINE_VERSION", "") != "" ? get_env("DB_ENGINE_VERSION", "") : null
  db_name                = get_env("DB_NAME", "rifaapp")
  db_username            = get_env("DB_USERNAME", "appuser")
  db_password            = get_env("TF_VAR_db_password", get_env("DB_PASSWORD", ""))
  db_port                = tonumber(get_env("DB_PORT", "5432"))
  db_instance_class      = get_env("DB_INSTANCE_CLASS", "db.t3.medium")
  db_reader_instance_count = tonumber(get_env("DB_READER_INSTANCE_COUNT", "1"))
  db_backup_retention    = tonumber(get_env("DB_BACKUP_RETENTION", "7"))
  db_snapshot_identifier = get_env("DB_SNAPSHOT_IDENTIFIER", "") != "" ? get_env("DB_SNAPSHOT_IDENTIFIER", "") : null
  db_skip_final_snapshot = get_env("DB_SKIP_FINAL_SNAPSHOT", "true") == "true"
  db_deletion_protection = get_env("DB_DELETION_PROTECTION", "false") == "true"
  db_publicly_accessible = get_env("DB_PUBLICLY_ACCESSIBLE", "false") == "true"
  db_apply_immediately   = get_env("DB_APPLY_IMMEDIATELY", "true") == "true"
}
