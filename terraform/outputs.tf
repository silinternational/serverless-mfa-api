
output "serverless-access-key-id" {
  value = one(module.serverless_user[*].aws_access_key_id)
}

output "serverless-secret-access-key" {
  value     = one(module.serverless_user[*].aws_secret_access_key)
  sensitive = true
}
