output "api_id" {
  value = aws_apigatewayv2_api.http.id
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.http.execution_arn
}

output "api_invoke_url" {
  value = aws_apigatewayv2_stage.main.invoke_url
}
