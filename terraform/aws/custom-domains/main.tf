locals {
  domain_name = "${var.certificate_subdomain}.${var.cloudflare_zone_name}"
}

module "certificate-primary-region" {
  source = "../acm-certificate"

  certificate_domain_name = local.domain_name
  cloudflare_zone_name    = var.cloudflare_zone_name

  providers = { aws = "aws" }
}

module "certificate-secondary-region" {
  source     = "../acm-certificate"
  depends_on = [module.certificate-primary-region]

  certificate_domain_name = local.domain_name
  cloudflare_zone_name    = var.cloudflare_zone_name
  create_dns_validation   = false # Because we already did for the primary region, and it will match.

  providers = { aws = "aws.secondary" }
}

module "custom-domain-primary-region" {
  source     = "../api-gateway-custom-domain"
  depends_on = [module.certificate-primary-region]

  api_name        = var.api_name
  api_stage       = var.api_stage
  certificate_arn = module.certificate-primary-region.certificate_arn
  domain_name     = module.certificate-primary-region.domain_name

  providers = { aws = "aws" }
}

module "custom-domain-secondary-region" {
  source     = "../api-gateway-custom-domain"
  depends_on = [module.certificate-secondary-region]

  api_name        = "${local.app_env}-mfa-api"
  api_stage       = local.app_env
  certificate_arn = module.certificate-secondary-region.certificate_arn
  domain_name     = module.certificate-secondary-region.domain_name

  providers = { aws = "aws.secondary" }
}
