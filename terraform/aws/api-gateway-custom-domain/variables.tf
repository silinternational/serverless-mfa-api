variable "api_name" {
  description = "The API Gateway API name, for associating with this custom domain"
  type        = string
}

variable "api_stage" {
  description = "The API stage ('dev' or 'prod'). Used in mapping the custom domain name in API Gateway."
  type        = string
}

variable "certificate_arn" {
  description = "The ARN for the Amazon certificate to use for this domain name"
  type        = string
}

variable "domain_name" {
  description = "The exact domain name for the API Gateway custom domain"
  type        = string
}
