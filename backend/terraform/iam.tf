data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "digi-raise-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# CloudWatch Logsへの書き込み権限（基本実行ロール）
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# DynamoDBアクセス権限
data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]
    resources = [
      aws_dynamodb_table.connections.arn,
      # GSIへのアクセスも許可
      "${aws_dynamodb_table.connections.arn}/index/*",
      aws_dynamodb_table.rooms.arn,
      aws_dynamodb_table.config.arn,
    ]
  }
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name   = "digi-raise-dynamodb-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dynamodb_access.json
}

# API Gateway Management API 権限（WebSocket接続への送信）
data "aws_iam_policy_document" "apigw_manage_connections" {
  statement {
    effect    = "Allow"
    actions   = ["execute-api:ManageConnections"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "apigw_manage_connections" {
  name   = "digi-raise-apigw-manage-connections"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.apigw_manage_connections.json
}
