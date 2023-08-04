
output "serverless_access_key_id" {
  value = one(module.serverless_user[*].aws_access_key_id)
}

output "serverless_secret_access_key" {
  value     = one(module.serverless_user[*].aws_secret_access_key)
  sensitive = true
}

output "primary_region_domain_name" {
  value = module.dns_for_failover.primary_region_domain_name
}

output "secondary_region_domain_name" {
  value = module.dns_for_failover.secondary_region_domain_name
}
