
/*
 * Create IAM user for Serverless framework to use to deploy the lambda function
 */
module "serverless-user" {
  source  = "silinternational/serverless-user/aws"
  version = "0.1.3"

  app_name           = "mfa-api"
  aws_region         = var.aws_region
  enable_api_gateway = true
  extra_policies = [
    jsonencode(
      {
        "Version" : "2012-10-17",
        "Statement" : [
          {
            "Effect" : "Allow",
            "Action" : [
              "dynamodb:DescribeTable"
            ],
            "Resource" : [
              "arn:aws:dynamodb:*:*:table/mfa-api_*"
            ]
          }
        ]
      }
    )
  ]
}
