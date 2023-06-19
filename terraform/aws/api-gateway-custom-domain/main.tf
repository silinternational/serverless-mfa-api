
# NOTE: For REST APIs, use `aws_api_gateway_*` resources, not
# `aws_apigatewayv2_*` resources.
data "aws_api_gateway_rest_api" "this" {
  name = var.api_name
}

resource "aws_api_gateway_domain_name" "this" {
  domain_name              = var.domain_name
  regional_certificate_arn = var.certificate_arn
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}
