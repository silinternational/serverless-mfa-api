
/*
 * Create IAM user for Serverless framework to use to deploy the lambda function
 */
module "serverless-user" {
  source  = "silinternational/serverless-user/aws"
  version = "0.1.0"

  app_name           = "mfa-api"
  aws_region         = var.aws_region
  enable_api_gateway = true

  extra_policies = [local.s3_policy]
}

output "serverless-access-key-id" {
  value = module.serverless-user.aws_access_key_id
}
output "serverless-secret-access-key" {
  value     = module.serverless-user.aws_secret_access_key
  sensitive = true
}


locals {
  s3_policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Effect" : "Allow",
        "Action" : [
          "s3:GetBucketPolicy",
        ],
        "Resource" : [
          "arn:aws:s3:::mfa-api-*-serverlessdeploymentbucket*"
        ]
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "apigateway:UpdateRestApiPolicy",
        ],
        "Resource" : [
          // dev-mfa-api
          "arn:aws:apigateway:${var.aws_region}:*:restapis/7f2jflg37i",
          // prod-mfa-api
          "arn:aws:apigateway:${var.aws_region}:*:restapis/7hk96xvik6",
        ]
      },
    ]
  })
}
