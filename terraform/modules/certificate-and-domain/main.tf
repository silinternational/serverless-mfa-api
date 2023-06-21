
locals {
  full_domain_name = "${var.certificate_subdomain}.${var.cloudflare_zone_name}"
}

module "certificate" {
  source = "github.com/silinternational/terraform-aws-acm-certificate?ref=0.2.0"

  certificate_domain_name = local.full_domain_name
  cloudflare_zone_name    = var.cloudflare_zone_name
  create_dns_validation   = var.create_dns_validation
}

module "domain" {
  source     = "github.com/silinternational/terraform-aws-api-gateway-custom-domain?ref=0.1.0"
  depends_on = [module.certificate.validation_id]

  api_name        = var.api_name
  certificate_arn = module.certificate.certificate_arn
  domain_name     = local.full_domain_name
}
