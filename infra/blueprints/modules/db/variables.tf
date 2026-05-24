variable "name_prefix" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "db_engine" {
  type    = string
  default = "aurora-postgresql"
}

variable "db_engine_version" {
  type    = string
  default = null
}

variable "db_name" {
  type    = string
  default = "rifaapp"
}

variable "db_username" {
  type    = string
  default = "appuser"
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.medium"
}

variable "db_reader_instance_count" {
  type    = number
  default = 1
}

variable "db_backup_retention" {
  type    = number
  default = 7
}

variable "db_snapshot_identifier" {
  type    = string
  default = null
}

variable "db_skip_final_snapshot" {
  type    = bool
  default = true
}

variable "db_deletion_protection" {
  type    = bool
  default = false
}

variable "db_publicly_accessible" {
  type    = bool
  default = false
}

variable "db_apply_immediately" {
  type    = bool
  default = true
}
