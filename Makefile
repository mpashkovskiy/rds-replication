PROFILE ?= roboten

bootstrap:
	npx cdk bootstrap --profile $(PROFILE)

deploy:
	npx cdk deploy --profile $(PROFILE)

docker-build:
	docker build -t copy-service .

run-identical: docker-build
	docker run -v ~/workspace/aws:/aws -it --rm -p 9000:8080 --entrypoint /aws/aws-lambda-rie copy-service /usr/local/bin/npx aws-lambda-ric identical.main

run-masked: docker-build
	docker run -v ~/workspace/aws:/aws -it --rm -p 9000:8080 --entrypoint /aws/aws-lambda-rie copy-service /usr/local/bin/npx aws-lambda-ric masked.main