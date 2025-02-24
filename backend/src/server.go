package main

import (
	"context"
	"net/http"
	"fmt"
	"server/web_api"

	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
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

	web_api.PostColl = db.Collection("posts")
	web_api.UserColl = db.Collection("users")

	echo.NotFoundHandler = func(c echo.Context) error {
		return c.String(http.StatusBadRequest, c.Request().URL.String())
	}

	router := echo.New()
	router.GET("/posts/top", web_api.GetPosts)
	router.GET("/posts/comments", web_api.GetComments)
	router.POST("/posts/top", web_api.CreatePost)
	router.POST("/posts/comments", web_api.CreateComment)
	router.GET("/users", web_api.GetUser)
	router.GET("/users/restore", web_api.RestoreUserFromCookie)
	router.POST("/signup", web_api.MakeUser)
	router.POST("/login", web_api.Login)
	router.DELETE("/posts", web_api.DeletePost)

	router.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173", "https://d3oiamcw3gvayn.cloudfront.net"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, "Authorization",},
		AllowCredentials: true,
	}))
	router.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey: []byte(web_api.SecretKey),
		TokenLookup: "cookie:Authorization",
		Skipper: func(c echo.Context) bool {
			if c.Path() == "/signup" || c.Path() == "/login" {
				return true
			}
			if c.Request().Method == "GET" && c.Path() != "/users" {
				return true
			}
			return false
		},
	}))

	echoLambda = echoadapter.NewV2(router)

}

func handler(req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return echoLambda.Proxy(req)
}

func main() {
	defer func() {
		var err error
		if err = client.Disconnect(context.TODO()); err != nil {
			return
		}
	}()

	lambda.Start(handler)
}
