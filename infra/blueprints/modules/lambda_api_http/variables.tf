variable "lambda_name" {
  type = string
}

variable "lambda_source_dir" {
  type = string
}

variable "lambda_handler" {
  type = string
}

variable "lambda_runtime" {
  type    = string
  default = "python3.11"
}

variable "lambda_memory_size" {
  type    = number
  default = 256
}

variable "lambda_timeout" {
  type    = number
  default = 10
}

variable "layer_arns" {
  type    = list(string)
  default = []
}

variable "lambda_log_retention" {
  type    = number
  default = 14
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_ids" {
  type = list(string)
}

variable "environment" {
  type    = map(string)
  default = {}
}

variable "api_id" {
  type = string
}

variable "api_execution_arn" {
  type = string
}

variable "route_keys" {
  type = list(string)
}

variable "tags" {
  type    = map(string)
  default = {}
}
