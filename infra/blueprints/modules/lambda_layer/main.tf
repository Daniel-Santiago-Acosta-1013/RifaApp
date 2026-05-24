data "archive_file" "layer" {
  type        = "zip"
  source_dir  = var.layer_source_dir
  output_path = "${path.module}/${var.layer_name}.zip"
}

resource "aws_lambda_layer_version" "layer" {
  layer_name          = var.layer_name
  description         = var.layer_description
  filename            = data.archive_file.layer.output_path
  source_code_hash    = data.archive_file.layer.output_base64sha256
  compatible_runtimes = var.compatible_runtimes
  license_info        = var.layer_license_info
}
