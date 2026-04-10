package main

import (
	"context"
	"log"
	"os"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/n-yata/digi-raise/backend/internal/auth"
	"github.com/n-yata/digi-raise/backend/internal/db"
	"github.com/n-yata/digi-raise/backend/internal/handler"
)

func main() {
	// 環境変数の取得
	connectionsTable := mustGetenv("CONNECTIONS_TABLE")
	configTable := mustGetenv("CONFIG_TABLE")
	secretKey := mustGetenv("SECRET_KEY")

	// AWS 設定のロード（コールドスタート時に一度だけ実行）
	cfg, err := awsconfig.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("failed to load AWS config: %v", err)
	}

	// DynamoDB クライアント作成
	dynamoClient := dynamodb.NewFromConfig(cfg)

	// 各コンポーネントの初期化
	connections := db.NewConnectionsTable(dynamoClient, connectionsTable)
	config := db.NewConfigTable(dynamoClient, configTable)
	verifier := auth.NewVerifier(secretKey)

	// ConnectHandler の作成
	h := handler.NewConnectHandler(connections, config, verifier)

	// Lambda ハンドラの登録
	lambda.Start(h.Handle)
}

// mustGetenv は環境変数を取得し、未設定の場合は Fatal で終了する
func mustGetenv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("required environment variable not set: %s", key)
	}
	return val
}
