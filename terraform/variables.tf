variable "aws_region" {
  default = "us-east-1"
}

variable "aws_region_secondary" {
  default = "us-west-2"
}

variable "aws_access_key_id" {
  default = null
}

variable "aws_secret_access_key" {
  default = null
}

variable "cloudflare_token" {
  description = "The Cloudflare limited access API token"
  type        = string
}

variable "cloudflare_domain" {
  description = "Cloudflare zone (domain) for DNS records"
  type        = string
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
  description = "WARNING: Changing this will replace (delete) resources, even your database. Used in naming and tagging resources."
  type        = string
  default     = "mfa-api"
}
