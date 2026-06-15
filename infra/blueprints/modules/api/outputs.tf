output "api_id" {
  value = aws_apigatewayv2_api.http.id
}

output "api_execution_arn" {
  value = aws_apigatewayv2_api.http.execution_arn
}

output "api_invoke_url" {
  value = aws_apigatewayv2_stage.main.invoke_url
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  value = aws_cognito_user_pool_client.frontend.id
}

output "cognito_jwt_authorizer_id" {
  value = aws_apigatewayv2_authorizer.cognito_jwt.id
}

output "cognito_region" {
  value = data.aws_region.current.region
}
