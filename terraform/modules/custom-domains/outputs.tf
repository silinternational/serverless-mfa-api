
output "primary_region_domain_name" {
  value = module.primary-region.regional_domain_name
}

output "secondary_region_domain_name" {
  value = module.secondary-region.regional_domain_name
}
