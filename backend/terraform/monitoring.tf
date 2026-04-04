# ---- SNS Topic ----
resource "aws_sns_topic" "alert" {
  name = "digi-raise-alert"
}

# メール通知サブスクリプション
# 初回terraform apply後、指定メールアドレスへ確認メールが届くため要承認
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alert.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# ---- SNS → emergency-shutdown Lambda サブスクリプション ----
resource "aws_sns_topic_subscription" "emergency_shutdown" {
  topic_arn = aws_sns_topic.alert.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.emergency_shutdown.arn
}

resource "aws_lambda_permission" "sns_emergency_shutdown" {
  statement_id  = "AllowSNSInvokeEmergencyShutdown"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.emergency_shutdown.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.alert.arn
}

# ---- CloudWatch Alarm: 接続数スパイク検知 ----
# $connect ルートへのリクエスト数が1分間で500を超えたら発火
resource "aws_cloudwatch_metric_alarm" "connection_spike" {
  alarm_name          = "digi-raise-connection-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConnectCount"
  namespace           = "AWS/ApiGateway"
  period              = 60
  statistic           = "Sum"
  threshold           = 500
  alarm_description   = "WebSocket接続数が1分間で500を超えました。DDoS等の異常アクセスの可能性があります。"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiId = aws_apigatewayv2_api.ws.id
    Stage = aws_apigatewayv2_stage.prod.name
  }

  alarm_actions = [aws_sns_topic.alert.arn]
  ok_actions    = [aws_sns_topic.alert.arn]
}

# ---- CloudWatch Alarm: Lambdaメッセージ処理スパイク検知 ----
# digi-raise-message の呼び出し回数が1時間で10000を超えたら発火
resource "aws_cloudwatch_metric_alarm" "lambda_spike" {
  alarm_name          = "digi-raise-lambda-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Invocations"
  namespace           = "AWS/Lambda"
  period              = 3600
  statistic           = "Sum"
  threshold           = 10000
  alarm_description   = "digi-raise-messageの呼び出し回数が1時間で10000を超えました。異常トラフィックの可能性があります。"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.message.function_name
  }

  alarm_actions = [aws_sns_topic.alert.arn]
  ok_actions    = [aws_sns_topic.alert.arn]
}

# ---- CloudWatch Log Groups ----
resource "aws_cloudwatch_log_group" "connect" {
  name              = "/aws/lambda/digi-raise-connect"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "disconnect" {
  name              = "/aws/lambda/digi-raise-disconnect"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "message" {
  name              = "/aws/lambda/digi-raise-message"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "emergency_shutdown" {
  name              = "/aws/lambda/digi-raise-emergency-shutdown"
  retention_in_days = 30
}
