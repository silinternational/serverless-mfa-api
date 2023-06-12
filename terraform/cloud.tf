terraform {
  cloud {
    organization = "gtis"

    workspaces {
      tags = ["app:serverless-mfa-api"]
    }
  }
}
