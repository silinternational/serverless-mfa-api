
data "aws_apigatewayv2_apis" "this" {
  name = var.api_name
}

resource "aws_apigatewayv2_domain_name" "this" {
  domain_name = var.domain_name

  domain_name_configuration {
    certificate_arn = var.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "this" {
  api_id      = data.aws_apigatewayv2_apis.this.ids[0]
  domain_name = var.domain_name
  stage       = var.api_stage
}
