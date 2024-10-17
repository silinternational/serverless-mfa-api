
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0.0, < 6.0.0"
    }
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}
