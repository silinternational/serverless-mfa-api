
variable "certificate_domain_name" {
  description = "Exact domain name for the certificate"
  type        = string
}

variable "cloudflare_zone_name" {
  description = "The Cloudflare zone (aka domain) name for the DNS record for certificate validation."
  type        = string
}

variable "create_dns_validation" {
  description = "Whether to create the DNS record for certificate validation"
  type        = bool
}
