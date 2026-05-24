variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "rifaapp"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "frontend_bucket_name" {
  type    = string
  default = ""
}

variable "frontend_force_destroy" {
  type    = bool
  default = false
}

variable "frontend_price_class" {
  type    = string
  default = "PriceClass_100"
}
