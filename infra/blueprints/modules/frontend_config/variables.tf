variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
}

variable "environment" {
  description = "Ambiente (dev, staging, prod)"
  type        = string
}

variable "api_invoke_url" {
  description = "URL base del API Gateway (sin trailing slash)"
  type        = string
}

variable "realtime_websocket_url" {
  description = "URL WebSocket para eventos realtime del frontend"
  type        = string
  default     = ""
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID para el frontend."
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito App Client ID para el frontend."
  type        = string
}

variable "cognito_region" {
  description = "Region AWS de Cognito."
  type        = string
}

variable "tags" {
  description = "Tags para los recursos"
  type        = map(string)
  default     = {}
}
