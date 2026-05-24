locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_ssm_parameter" "api_read_url" {
  name  = "/${var.project_name}/${var.environment}/api-read-url"
  type  = "String"
  value = "${var.api_invoke_url}/rifa-app-read"
  tags  = var.tags
}

resource "aws_ssm_parameter" "api_write_url" {
  name  = "/${var.project_name}/${var.environment}/api-write-url"
  type  = "String"
  value = "${var.api_invoke_url}/rifa-app-write"
  tags  = var.tags
}
