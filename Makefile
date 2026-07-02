# Variables
APP_NAME := localize
ENTRY_POINT := ./cmd/localize
BUILD_DIR := bin

# Docker
IMAGE_NAME := localize
TAG := latest
DOCKER_BUILDKIT := 1

# Default target
.PHONY: all
all: build

# Run the application
.PHONY: run
run:
	go run $(ENTRY_POINT)

# Build the application
.PHONY: build
build:
	@mkdir -p $(BUILD_DIR)
	go build -o $(BUILD_DIR)/$(APP_NAME).exe $(ENTRY_POINT)
	@echo "Build successful: $(BUILD_DIR)/$(APP_NAME).exe"

# Build the Docker image
.PHONY: build-docker
build-docker:
	DOCKER_BUILDKIT=$(DOCKER_BUILDKIT) docker build -t $(IMAGE_NAME):$(TAG) .


# Clean the build directory
.PHONY: clean
clean:
	@rm -rf $(BUILD_DIR)
	@echo "Cleaned up $(BUILD_DIR)"

tools:
	go install github.com/swaggo/swag/v2/cmd/swag@latest

lint:
	golangci-lint run --timeout 5m

swag:
	swag fmt
	swag init -g cmd/localize/main.go \
		--o ./docs/api \
		--ot json \
		--parseDependency \
		--parseInternal \
		--collectionFormat multi
