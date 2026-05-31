locals {
  name_prefix = "${var.project_name}-${var.environment}"
  base_url    = trimsuffix(var.api_invoke_url, "/")
}

resource "aws_ssm_parameter" "api_read_url" {
  name  = "/${var.project_name}/${var.environment}/api-read-url"
  type  = "String"
  value = "${local.base_url}/rifa-app-read"
  tags  = var.tags
}

resource "aws_ssm_parameter" "api_write_url" {
  name  = "/${var.project_name}/${var.environment}/api-write-url"
  type  = "String"
  value = "${local.base_url}/rifa-app-write"
  tags  = var.tags
}

resource "aws_ssm_parameter" "realtime_websocket_url" {
  name  = "/${var.project_name}/${var.environment}/realtime-websocket-url"
  type  = "String"
  value = var.realtime_websocket_url
  tags  = var.tags
}
