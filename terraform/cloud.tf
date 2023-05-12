terraform {
  cloud {
    organization = "gtis"

    workspaces {
      name = "serverless-mfa-api"
    }
  }
}
