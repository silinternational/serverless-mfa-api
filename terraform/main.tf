
/*
 * Create IAM user for Serverless framework to use to deploy the lambda function
 */
module "serverless-user" {
  source  = "silinternational/serverless-user/aws"
  version = "0.1.0"

  app_name           = "mfa-api"
  aws_region         = var.aws_region
  enable_api_gateway = true
}

output "serverless-access-key-id" {
  value = module.serverless-user.aws_access_key_id
}
output "serverless-secret-access-key" {
  value     = module.serverless-user.aws_secret_access_key
  sensitive = true
}
