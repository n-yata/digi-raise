package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/n-yata/digi-raise/backend/internal/apigw"
	"github.com/n-yata/digi-raise/backend/internal/db"
	"github.com/n-yata/digi-raise/backend/internal/handler"
)

func main() {
	// 環境変数を読み込む
	connectionsTable := mustEnv("CONNECTIONS_TABLE")
	roomsTable := mustEnv("ROOMS_TABLE")
	apiGatewayEndpoint := mustEnv("API_GATEWAY_ENDPOINT")

	// AWS Config をロード
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("load aws config: %v", err)
	}

	// DynamoDB クライアントを作成
	dynamoClient := dynamodb.NewFromConfig(cfg)

	// テーブル操作クライアントを初期化
	connTable := db.NewConnectionsTable(dynamoClient, connectionsTable)
	rTable := db.NewRoomsTable(dynamoClient, roomsTable)

	// API Gateway Management クライアントを初期化
	apigwClient := apigw.NewClient(cfg, apiGatewayEndpoint)

	// DisconnectHandler を作成
	h := handler.NewDisconnectHandler(connTable, rTable, apigwClient)

	lambda.Start(h.Handle)
}

// mustEnv は環境変数を取得し、未設定の場合は Fatal で終了する
func mustEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		log.Fatalf("environment variable %s is required", key)
	}
	return val
}
