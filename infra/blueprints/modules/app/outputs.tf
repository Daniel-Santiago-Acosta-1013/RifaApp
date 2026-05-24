output "api_url" {
  value = aws_apigatewayv2_stage.main.invoke_url
}

output "api_base_url" {
  value = "${aws_apigatewayv2_stage.main.invoke_url}${local.api_base_path}"
}

output "lambda_read_function_name" {
  value = aws_lambda_function.read.function_name
}

output "lambda_write_function_name" {
  value = aws_lambda_function.write.function_name
}

output "db_cluster_endpoint" {
  value = aws_rds_cluster.db.endpoint
}

output "db_reader_endpoint" {
  value = aws_rds_cluster.db.reader_endpoint
}

output "db_port" {
  value = var.db_port
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
