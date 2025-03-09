package main

import (
	"context"
	"fmt"
	"server/web_api"

	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {

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
	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("disconnected from cluster")
	}()
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

	router := echo.New()
	router.Debug = true
	router.GET("/posts/top", web_api.GetPosts)
	router.GET("/posts/comments", web_api.GetComments)
	router.POST("/posts/top", web_api.CreatePost)
	router.POST("/posts/comments", web_api.CreateComment)
	router.GET("/users", web_api.GetUser)
	router.GET("/users/restore", web_api.RestoreUserFromCookie)
	router.POST("/signup", web_api.MakeUser)
	router.POST("/login", web_api.Login)
	router.POST("/users/follow/:id", web_api.FollowUser)
	router.POST("/users/unfollow/:id", web_api.UnfollowUser)
	router.DELETE("/posts", web_api.DeletePost)

	router.Use(middleware.RequestLoggerWithConfig(web_api.Log))
	router.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:5175"}, // placeholder for local vite
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, "Authorization"},
		AllowCredentials: true,
	}))
	router.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey:  []byte(web_api.SecretKey),
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

	router.Logger.Debug(router.Start("localhost:8080"))
}
