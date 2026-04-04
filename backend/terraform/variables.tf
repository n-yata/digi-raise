variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "secret_key" {
  description = "WebSocket接続認証に使用するシークレットキー"
  type        = string
  sensitive   = true
}

variable "alert_email" {
  description = "CloudWatchアラート通知先メールアドレス"
  type        = string
}
