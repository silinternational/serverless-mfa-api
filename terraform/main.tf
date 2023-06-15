
locals {
  /* The app_env is used in some resource names. */
  app_env = var.app_environment == "production" ? "prod" : "dev"
}

/*
 * Create IAM user for Serverless framework to use to deploy the lambda function
 */
module "serverless-user" {
  count   = var.app_environment == "staging" ? 1 : 0
  source  = "silinternational/serverless-user/aws"
  version = "0.3.2"

  app_name           = "mfa-api"
  aws_region         = var.aws_region
  aws_region_policy  = "*"
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


/*
 * Manage custom domain name resources.
 */
module "certificate-primary-region" {
  source = "aws/acm-certificate"

  certificate_domain_name = "mfa-api.${var.cloudflare_zone_name}"
  cloudflare_zone_name    = var.cloudflare_zone_name

  providers = { aws = "aws" }
}
module "certificate-secondary-region" {
  source     = "aws/acm-certificate"
  depends_on = [module.certificate-primary-region]

  certificate_domain_name = "mfa-api.${var.cloudflare_zone_name}"
  cloudflare_zone_name    = var.cloudflare_zone_name
  create_dns_validation   = false # Because we already did, and it will match.

  providers = { aws = "aws.secondary" }
}


/*
 * Manage DynamoDB tables used by the functions.
 */

resource "aws_dynamodb_table" "api_keys" {
  name             = "mfa-api_${local.app_env}_api-key_global"
  hash_key         = "value"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  attribute {
    name = "value"
    type = "S"
  }

  replica {
    region_name = var.aws_region_secondary
  }

  lifecycle {
    ignore_changes = [replica]
  }
}

resource "aws_dynamodb_table" "totp" {
  name             = "mfa-api_${local.app_env}_totp_global"
  hash_key         = "uuid"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  attribute {
    name = "uuid"
    type = "S"
  }

  replica {
    region_name = var.aws_region_secondary
  }

  lifecycle {
    ignore_changes = [replica]
  }
}

resource "aws_dynamodb_table" "u2f" {
  name             = "mfa-api_${local.app_env}_u2f_global"
  hash_key         = "uuid"
  billing_mode     = "PAY_PER_REQUEST"
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"

  attribute {
    name = "uuid"
    type = "S"
  }

  replica {
    region_name = var.aws_region_secondary
  }

  lifecycle {
    ignore_changes = [replica]
  }
}
