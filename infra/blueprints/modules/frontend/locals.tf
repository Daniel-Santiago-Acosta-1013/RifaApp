locals {
  name_prefix = "${var.project_name}-${var.environment}"
  frontend_bucket_name = var.frontend_bucket_name != "" ? var.frontend_bucket_name : "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
    },
    var.tags
  )
}
