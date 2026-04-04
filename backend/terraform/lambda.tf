# ---- Lambda ソースコードのアーカイブ ----

data "archive_file" "connect" {
  type        = "zip"
  source_dir  = "../../backend/lambda/connect"
  output_path = "${path.module}/.lambda_zips/connect.zip"
}

data "archive_file" "disconnect" {
  type        = "zip"
  source_dir  = "../../backend/lambda/disconnect"
  output_path = "${path.module}/.lambda_zips/disconnect.zip"
}

data "archive_file" "message" {
  type        = "zip"
  source_dir  = "../../backend/lambda/message"
  output_path = "${path.module}/.lambda_zips/message.zip"
}

data "archive_file" "emergency_shutdown" {
  type        = "zip"
  source_dir  = "../../backend/lambda/emergency-shutdown"
  output_path = "${path.module}/.lambda_zips/emergency-shutdown.zip"
}

# ---- digi-raise-connect ----
resource "aws_lambda_function" "connect" {
  function_name    = "digi-raise-connect"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.connect.output_path
  source_code_hash = data.archive_file.connect.output_base64sha256

  environment {
    variables = {
      SECRET_KEY        = var.secret_key
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
      CONFIG_TABLE      = aws_dynamodb_table.config.name
    }
  }
}

# ---- digi-raise-disconnect ----
resource "aws_lambda_function" "disconnect" {
  function_name    = "digi-raise-disconnect"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.disconnect.output_path
  source_code_hash = data.archive_file.disconnect.output_base64sha256

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
      ROOMS_TABLE       = aws_dynamodb_table.rooms.name
      # APIGW_ENDPOINTはAPI Gatewayデプロイ後にaws_lambda_function_event_invoke_configで注入
      # terraform apply後に outputs.tf の websocket_url を確認して手動または再applyで設定
      APIGW_ENDPOINT = "https://placeholder.execute-api.${var.aws_region}.amazonaws.com/prod"
    }
  }

  lifecycle {
    ignore_changes = [environment[0].variables["APIGW_ENDPOINT"]]
  }
}

# ---- digi-raise-message ----
resource "aws_lambda_function" "message" {
  function_name    = "digi-raise-message"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.message.output_path
  source_code_hash = data.archive_file.message.output_base64sha256

  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.connections.name
      ROOMS_TABLE       = aws_dynamodb_table.rooms.name
      APIGW_ENDPOINT    = "https://placeholder.execute-api.${var.aws_region}.amazonaws.com/prod"
    }
  }

  lifecycle {
    ignore_changes = [environment[0].variables["APIGW_ENDPOINT"]]
  }
}

# ---- digi-raise-emergency-shutdown ----
resource "aws_lambda_function" "emergency_shutdown" {
  function_name    = "digi-raise-emergency-shutdown"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.emergency_shutdown.output_path
  source_code_hash = data.archive_file.emergency_shutdown.output_base64sha256

  environment {
    variables = {
      CONFIG_TABLE = aws_dynamodb_table.config.name
    }
  }
}

# ---- APIGW_ENDPOINT を API Gatewayステージ作成後に上書きする ----
#
# 課題: Lambda関数とAPI Gatewayステージの間に循環依存が生じるため、
#       Lambda作成時点では invoke_url が未確定。
#
# 解決策: 初回applyはplaceholder値で作成し、terraform_data (local-exec) で
#         ステージ確定後にAWS CLIで正しいエンドポイントへ上書きする。
#         invoke_url は wss:// スキームのため https:// に変換する。
#
# 注意: local-execの実行にはAWS CLIが必要。
#       terraform apply を実行する環境でAWS CLIの認証設定を行ってください。

locals {
  # wss://xxx.execute-api.region.amazonaws.com/prod -> https://xxx.execute-api.region.amazonaws.com/prod
  # Lambda の @connections API は https スキームで呼び出す必要がある
  apigw_https_endpoint = replace(aws_apigatewayv2_stage.prod.invoke_url, "wss://", "https://")
}

resource "terraform_data" "update_apigw_endpoint" {
  # invoke_urlが変化したときだけ再実行する
  input = local.apigw_https_endpoint

  provisioner "local-exec" {
    command = <<-EOT
      aws lambda update-function-configuration \
        --function-name ${aws_lambda_function.disconnect.function_name} \
        --environment "Variables={CONNECTIONS_TABLE=${aws_dynamodb_table.connections.name},ROOMS_TABLE=${aws_dynamodb_table.rooms.name},APIGW_ENDPOINT=${local.apigw_https_endpoint}}" \
        --region ${var.aws_region}

      aws lambda update-function-configuration \
        --function-name ${aws_lambda_function.message.function_name} \
        --environment "Variables={CONNECTIONS_TABLE=${aws_dynamodb_table.connections.name},ROOMS_TABLE=${aws_dynamodb_table.rooms.name},APIGW_ENDPOINT=${local.apigw_https_endpoint}}" \
        --region ${var.aws_region}
    EOT
  }

  depends_on = [aws_apigatewayv2_stage.prod]
}
