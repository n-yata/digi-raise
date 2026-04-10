GOOS=linux
GOARCH=amd64
CGO_ENABLED=0

FUNCTIONS = connect disconnect message emergency-shutdown

.PHONY: build deploy clean test

build:
	@for fn in $(FUNCTIONS); do \
		echo "Building $$fn..."; \
		GOOS=$(GOOS) GOARCH=$(GOARCH) CGO_ENABLED=$(CGO_ENABLED) \
		go build -tags lambda.norpc \
		-o dist/$$fn/bootstrap \
		./cmd/$$fn/; \
	done

deploy: build
	sam deploy --config-file infra/samconfig.toml

clean:
	rm -rf dist/

test:
	go test ./...
