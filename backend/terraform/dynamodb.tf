# ---- DigiRaiseConnections ----
# WebSocket接続情報を管理するテーブル
# roomCode-index GSIでルームごとの接続一覧を取得できる
resource "aws_dynamodb_table" "connections" {
  name         = "DigiRaiseConnections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "connectionId"

  attribute {
    name = "connectionId"
    type = "S"
  }

  attribute {
    name = "roomCode"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  global_secondary_index {
    name            = "roomCode-index"
    hash_key        = "roomCode"
    projection_type = "ALL"
  }
}

# ---- DigiRaiseRooms ----
# バトルルーム情報を管理するテーブル
resource "aws_dynamodb_table" "rooms" {
  name         = "DigiRaiseRooms"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "roomCode"

  attribute {
    name = "roomCode"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

# ---- DigiRaiseConfig ----
# アプリケーション設定（メンテナンスモードなど）を管理するテーブル
resource "aws_dynamodb_table" "config" {
  name         = "DigiRaiseConfig"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "configKey"

  attribute {
    name = "configKey"
    type = "S"
  }
}

# メンテナンスモードの初期レコード
resource "aws_dynamodb_table_item" "maintenance_mode" {
  table_name = aws_dynamodb_table.config.name
  hash_key   = aws_dynamodb_table.config.hash_key

  item = jsonencode({
    configKey   = { S = "maintenance_mode" }
    value       = { S = "false" }
    updatedAt   = { N = "0" }
  })
}
