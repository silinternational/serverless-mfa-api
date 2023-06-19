
variable "aws_region" {
  description = "The primary AWS region (e.g. us-east-2)"
  type        = string
}

variable "aws_region_secondary" {
  description = "The primary AWS region (e.g. us-west-2)"
  type        = string
}

variable "cloudflare_zone_name" {
  description = "The Cloudflare zone (aka domain) name"
  type        = string
}

variable "primary_region_domain_name" {
  description = "The API Gateway primary region's endpoint domain name"
  type        = string
}

variable "secondary_region_domain_name" {
  description = "The API Gateway secondary region's endpoint domain name"
  type        = string
}

variable "subdomain" {
  description = "The subdomain for the CNAME record."
  type        = string
}
