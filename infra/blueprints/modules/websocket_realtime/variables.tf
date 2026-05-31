variable "name_prefix" {
  type = string
}

variable "lambda_source_dir" {
  type = string
}

variable "lambda_handler" {
  type    = string
  default = "rifaapp.realtime.handler.handler"
}

variable "lambda_runtime" {
  type    = string
  default = "python3.14"
}

variable "lambda_memory_size" {
  type    = number
  default = 256
}

variable "lambda_timeout" {
  type    = number
  default = 10
}

variable "lambda_log_retention" {
  type    = number
  default = 14
}

variable "layer_arns" {
  type    = list(string)
  default = []
}

variable "api_stage_name" {
  type    = string
  default = "$default"
}

variable "tags" {
  type    = map(string)
  default = {}
}
