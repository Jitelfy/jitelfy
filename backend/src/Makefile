.PHONY: all clean

all: bootstrap

clean:
	rm -rf bootstrap

bootstrap : server.go ./web_api/user.go ./web_api/posts.go ./web_api/logger.go
	GO_ARCH=amd64 CGO_ENABLED=0 GO_OS=linux go build -o bootstrap .
	zip bootstrap.zip bootstrap
