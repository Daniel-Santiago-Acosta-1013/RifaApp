locals {
  name_prefix = "${var.project_name}-${var.environment}"
  lambda_read_source_dir = var.lambda_read_source_dir
  lambda_write_source_dir = var.lambda_write_source_dir
  api_base_path = "/${trim(var.api_base_path, "/")}"
  api_gateway_base_path = var.api_stage_name == "$default" ? "" : "/${var.api_stage_name}"
  tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
    },
    var.tags
  )
}
