package main

import (
	"context"
	"net/http"
	"fmt"
	"server/web_api"

	"github.com/labstack/echo/v4"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	echoadapter "github.com/awslabs/aws-lambda-go-api-proxy/echo"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var echoLambda *echoadapter.EchoLambdaV2
var client *mongo.Client

func init() {

	// mongodb
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI("mongodb+srv://jitelfy:JitelfyForever33@jitelfycluster.hgw9u.mongodb.net/" +
		"?retryWrites=true&w=majority&appName=JitelfyCluster").SetServerAPIOptions(serverAPI)

	// create a client, connect to server
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		fmt.Println(err)
		return
	}
	// Send a ping to confirm a successful connection
	var db = client.Database("jitelfy")
	if err := db.RunCommand(context.TODO(),
		bson.D{{"ping", 1}}).Err(); err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("Jitelfy successfully connected to Cluster Server.")

	web_api.PostColl = db.Collection("posts")
	web_api.UserColl = db.Collection("users")

	echo.NotFoundHandler = func(c echo.Context) error {
		return c.String(http.StatusBadRequest, c.Request().URL.String())
	}

	router := echo.New()
	router.Debug = true
	router.GET("/posts/top", web_api.GetPosts)
	router.GET("/posts/comments", web_api.GetComments)
	router.POST("/posts/top", web_api.CreatePost)
	router.POST("/posts/comments", web_api.CreateComment)

	router.GET("/users", web_api.GetUser)
	router.POST("/users", web_api.MakeUser)


	echoLambda = echoadapter.NewV2(router)

}

func handler(req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return echoLambda.Proxy(req)
}

func main() {
	defer func() {
		var err error
		if err = client.Disconnect(context.TODO()); err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("disconnected from cluster")
	}()

	lambda.Start(handler)
}
