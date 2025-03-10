.PHONY: all clean deploy

all: bootstrap

clean:
	rm -rf bootstrap bootstrap.zip

bootstrap : server.go ./web_api/user.go ./web_api/posts.go ./web_api/logger.go ./web_api/session.go ./web_api/pass_hash.go
	GOARCH=amd64 CGO_ENABLED=0 GO_OS=linux go build -o bootstrap -tags lambda.norpc .
	zip bootstrap.zip bootstrap

deploy: bootstrap
	aws lambda update-function-code --function-name jitelfy \
		--zip-file fileb://bootstrap.zip --no-cli-pager
		
