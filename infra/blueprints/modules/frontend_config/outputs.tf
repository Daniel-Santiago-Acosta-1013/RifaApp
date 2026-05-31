output "api_read_parameter_name" {
  value = aws_ssm_parameter.api_read_url.name
}

output "api_write_parameter_name" {
  value = aws_ssm_parameter.api_write_url.name
}

output "realtime_websocket_parameter_name" {
  value = aws_ssm_parameter.realtime_websocket_url.name
}
