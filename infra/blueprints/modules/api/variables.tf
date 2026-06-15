variable "name_prefix" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "api_stage_name" {
  type    = string
  default = "$default"
}

variable "enable_cors" {
  type    = bool
  default = true
}

variable "cors_allow_origins" {
  type    = list(string)
  default = ["*"]
}

variable "cors_allow_headers" {
  type    = list(string)
  default = ["*"]
}

variable "cors_allow_methods" {
  type    = list(string)
  default = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "cognito_email_identity" {
  description = "Email individual para verificar en SES y usar como remitente de Cognito solo en modo DEVELOPER. Dejalo vacio si usas cognito_ses_source_arn."
  type        = string
  default     = ""
}

variable "cognito_ses_source_arn" {
  description = "ARN de identidad SES verificada. Si se define, Cognito envia correos con SES en modo DEVELOPER."
  type        = string
  default     = null
}

variable "cognito_from_email_address" {
  description = "Direccion From visible en correos de Cognito. Ej: RifaApp <no-reply@example.com>."
  type        = string
  default     = null
}

variable "cognito_reply_to_email_address" {
  description = "Direccion Reply-To para correos de Cognito."
  type        = string
  default     = null
}

variable "cognito_email_sending_account" {
  description = "COGNITO_DEFAULT o DEVELOPER. Usa DEVELOPER solo con una identidad SES ya verificada."
  type        = string
  default     = "COGNITO_DEFAULT"

  validation {
    condition     = contains(["COGNITO_DEFAULT", "DEVELOPER"], var.cognito_email_sending_account)
    error_message = "cognito_email_sending_account debe ser COGNITO_DEFAULT o DEVELOPER."
  }
}

variable "cognito_password_minimum_length" {
  type    = number
  default = 8
}
