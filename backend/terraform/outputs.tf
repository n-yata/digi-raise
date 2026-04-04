output "websocket_url" {
  description = "WebSocket API エンドポイントURL（フロントエンドの接続先）"
  value       = aws_apigatewayv2_stage.prod.invoke_url
}

output "apigw_endpoint" {
  description = "APIGW_ENDPOINT（disconnect / message Lambda の環境変数に設定する値）"
  # invoke_url は wss:// スキームのため https:// に変換して Lambda から利用できる形式で出力
  value = replace(aws_apigatewayv2_stage.prod.invoke_url, "wss://", "https://")
}

output "connections_table_name" {
  description = "DigiRaiseConnections DynamoDBテーブル名"
  value       = aws_dynamodb_table.connections.name
}

output "rooms_table_name" {
  description = "DigiRaiseRooms DynamoDBテーブル名"
  value       = aws_dynamodb_table.rooms.name
}

output "config_table_name" {
  description = "DigiRaiseConfig DynamoDBテーブル名"
  value       = aws_dynamodb_table.config.name
}

output "lambda_role_arn" {
  description = "Lambda実行ロールのARN"
  value       = aws_iam_role.lambda.arn
}

output "sns_topic_arn" {
  description = "アラート通知用SNS TopicのARN"
  value       = aws_sns_topic.alert.arn
}
