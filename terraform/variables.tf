variable "aws_region" {
  default = "us-east-1"
}

variable "aws_access_key_id" {
}

variable "aws_secret_access_key" {
}

/*
 * AWS tag values
 */

variable "app_customer" {
  description = "customer name to use for the itse_app_customer tag"
  type        = string
  default     = "shared"
}

variable "app_environment" {
  description = "environment name to use for the itse_app_environment tag, e.g. staging, production"
  type        = string
  default     = "production"
}

variable "app_name" {
  description = "app name to use for the itse_app_name tag"
  type        = string
  default     = "serverless-mfa-api"
}
