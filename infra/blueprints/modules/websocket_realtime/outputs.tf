output "connections_table_name" {
  value = aws_dynamodb_table.connections.name
}

output "connections_table_arn" {
  value = aws_dynamodb_table.connections.arn
}

output "websocket_api_id" {
  value = aws_apigatewayv2_api.websocket.id
}

output "websocket_execution_arn" {
  value = aws_apigatewayv2_api.websocket.execution_arn
}

output "websocket_client_url" {
  value = local.websocket_client_url
}

output "websocket_management_endpoint" {
  value = local.websocket_management_url
}

output "lambda_function_name" {
  value = aws_lambda_function.lambda.function_name
}
