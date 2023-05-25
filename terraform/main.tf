
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
              "dynamodb:DescribeGlobalTableSettings",
              "dynamodb:DescribeGlobalTable"
            ],
            "Resource" : "arn:aws:dynamodb:*:*:global-table/mfa-api_*"
          },
          {
            "Effect" : "Allow",
            "Action" : [
              "dynamodb:BatchWriteItem",
              "dynamodb:CreateTable",
              "dynamodb:CreateTableReplica",
              "dynamodb:DeleteItem",
              "dynamodb:DescribeContinuousBackups",
              "dynamodb:DescribeContributorInsights",
              "dynamodb:DescribeKinesisStreamingDestination",
              "dynamodb:DescribeTable",
              "dynamodb:DescribeTimeToLive",
              "dynamodb:GetItem",
              "dynamodb:ListTagsOfResource",
              "dynamodb:PutItem",
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:TagResource",
              "dynamodb:UntagResource",
              "dynamodb:UpdateItem",
              "dynamodb:UpdateTable"
            ],
            "Resource" : "arn:aws:dynamodb:*:*:table/mfa-api_*"
          },
          {
            "Effect" : "Allow",
            "Action" : [
              "dynamodb:Scan",
              "dynamodb:Query"
            ],
            "Resource" : "arn:aws:dynamodb:*:*:table/mfa-api_*/index/*"
          },
          {
            "Effect" : "Allow",
            "Action" : [
              "iam:CreateServiceLinkedRole",
              "iam:TagRole",
              "iam:UntagRole"
            ],
            "Resource" : "arn:aws:iam::*:role/*"
          }
        ]
      }
    )
  ]
}
