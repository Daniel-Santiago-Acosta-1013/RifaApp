output "layer_arn" {
  value = aws_lambda_layer_version.layer.arn
}

output "layer_version" {
  value = aws_lambda_layer_version.layer.version
}
