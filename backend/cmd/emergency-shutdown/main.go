package main

import (
	"context"
	"log"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/n-yata/digi-raise/backend/internal/db"
)

var configTable *db.ConfigTable

func init() {
	tableName := os.Getenv("CONFIG_TABLE")
	if tableName == "" {
		log.Fatal("CONFIG_TABLE environment variable is required")
	}

	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		log.Fatalf("failed to load AWS config: %v", err)
	}

	dynamoClient := dynamodb.NewFromConfig(cfg)
	configTable = db.NewConfigTable(dynamoClient, tableName)
}

func handler(ctx context.Context, event events.SNSEvent) error {
	for _, record := range event.Records {
		log.Printf("emergency-shutdown triggered: subject=%s message=%s",
			record.SNS.Subject, record.SNS.Message)
	}

	if err := configTable.SetMaintenanceMode(ctx, true); err != nil {
		log.Printf("CRITICAL: failed to enable maintenance mode: %v", err)
		return err
	}

	log.Printf("maintenance mode ENABLED - all new connections will be rejected")
	return nil
}

func main() {
	lambda.Start(handler)
}
