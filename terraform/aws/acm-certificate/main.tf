
data "cloudflare_zone" "this" {
  name = var.cloudflare_zone_name
}

resource "aws_acm_certificate" "this" {
  domain_name       = var.certificate_domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "cloudflare_record" "validation" {
  count = var.create_dns_validation ? 1 : 0

  name    = tolist(aws_acm_certificate.this[0].domain_validation_options)[0].resource_record_name
  value   = tolist(aws_acm_certificate.this[0].domain_validation_options)[0].resource_record_value
  type    = tolist(aws_acm_certificate.this[0].domain_validation_options)[0].resource_record_type
  zone_id = data.cloudflare_zone.this.id
  proxied = false
}

resource "aws_acm_certificate_validation" "this" {
  count                   = var.create_dns_validation ? 1 : 0
  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [cloudflare_record.validation[0].hostname]
}
