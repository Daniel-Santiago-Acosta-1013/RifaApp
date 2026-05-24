variable "layer_name" {
  type = string
}

variable "layer_source_dir" {
  type = string
}

variable "layer_description" {
  type    = string
  default = "Dependencias compartidas para Lambdas"
}

variable "compatible_runtimes" {
  type    = list(string)
  default = ["python3.11"]
}

variable "layer_license_info" {
  type    = string
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}
