
variable "app_name" {
  description = "Short name for the app (e.g. 'mfa-api'). Used as the subdomain."
  type        = string
}

variable "aws_region" {
  description = "The primary AWS region (e.g. us-east-2)"
  type        = string
}

variable "aws_region_secondary" {
  description = "The secondary AWS region (e.g. us-west-2)"
  type        = string
}

variable "cloudflare_zone_name" {
  description = "The Cloudflare zone (aka domain) name"
  type        = string
}

variable "serverless_stage" {
  description = "Short name for the stage (aka environment): 'dev' or 'prod'"
  type        = string
}
