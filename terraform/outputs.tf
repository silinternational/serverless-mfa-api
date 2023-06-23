
/* Old names, using hyphens. Will be removed in next major release: */

output "serverless-access-key-id" {
  value = one(module.serverless-user[*].aws_access_key_id)
}

output "serverless-secret-access-key" {
  value     = one(module.serverless-user[*].aws_secret_access_key)
  sensitive = true
}


/* New names, using underscores: */

output "serverless_access_key_id" {
  value = one(module.serverless-user[*].aws_access_key_id)
}

output "serverless_secret_access_key" {
  value     = one(module.serverless-user[*].aws_secret_access_key)
  sensitive = true
}
