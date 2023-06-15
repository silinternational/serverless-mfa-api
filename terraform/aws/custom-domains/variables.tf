variable "api_name" {
  description = "The API Gateway API name, for associating with the custom domains"
  type        = string
}

variable "api_stage" {
  description = "The API stage ('dev' or 'prod'). Used in mapping the custom domain name in API Gateway."
  type        = string
}

variable "certificate_subdomain" {
  description = "The subdomain for the API Gateway custom domain. Will be combined with the Cloudflare zone (aka domain)."
  type        = string
}

variable "cloudflare_zone_name" {
  description = "The Cloudflare zone (aka domain) name for the DNS record for certificate validation."
  type        = string
}
