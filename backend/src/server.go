package main

import (
	"context"
	"fmt"
	"server/web_api"

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
	router.POST("/users", web_api.MakeUser)

	router.Use(middleware.RequestLoggerWithConfig(web_api.Log))
	router.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:5173"}, // placeholder for local vite
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))

	router.Logger.Debug(router.Start("localhost:8080"))
}
