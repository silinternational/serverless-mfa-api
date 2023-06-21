
locals {
  primary_region_summary   = "${var.aws_region}: ${var.primary_region_domain_name}"
  secondary_region_summary = "${var.aws_region_secondary}: ${var.secondary_region_domain_name}"
}

data "cloudflare_zone" "this" {
  name = var.cloudflare_zone_name
}

resource "cloudflare_record" "public-cname" {
  comment = "For easy fail over. ${local.primary_region_summary} / ${local.secondary_region_summary}"
  name    = "${var.subdomain}.${var.cloudflare_zone_name}"
  proxied = true
  ttl     = 1 # ttl must be set to 1 when proxied is true
  type    = "CNAME"
  value   = var.primary_region_domain_name
  zone_id = data.cloudflare_zone.this.id
}
