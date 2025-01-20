package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var id int = 2

type Post struct {
	// these ids structs will be replaced
	// with mongodb ids
	Id       int    `json:"id"`
	UserId   int    `json:"userid"`
	ParentId int    `json:"parentid"`
	ChildIds []int  `json:"childids"`
	LikeIds  []int  `json:"likeids"`
	Time     string `json:"time"`
	Text     string `json:"text"`
	Embed    string `json:"embed"`
	Song     string `json:"song"`
}

// need to figure out if comment and post ids should be separated
var postdb map[int]Post
var commentdb map[int]Post

const (
	colorReset = "\033[0m"
	colorRed   = "\033[31m"
	colorGreen = "\033[32m"
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
	}()
	// Send a ping to confirm a successful connection
	if err := client.Database("admin").RunCommand(context.TODO(),
		bson.D{{"ping", 1}}).Err(); err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("Jitelfy successfully connected to Cluster Server.")

	router := echo.New()
	router.Debug = true
	router.GET("/posts/top", getPosts)
	router.POST("/posts/top", createPost)
	router.POST("/posts/comment", createComment)
	postdb = make(map[int]Post)
	commentdb = make(map[int]Post)
	postdb[1] = Post{
		Id:    1,
		Time:  time.Now().Format(time.RFC3339),
		Text:  "Test post",
		Embed: "URL",
		Song:  "Song",
	}

	var logger = middleware.RequestLoggerConfig{
		LogStatus:     true,
		LogURI:        true,
		LogRemoteIP:   true,
		LogMethod:     true,
		LogLatency:    true,
		LogValuesFunc: logger,
	}

	router.Use(middleware.RequestLoggerWithConfig(logger))

	router.Logger.Debug(router.Start("localhost:8080"))
}

func getPosts(c echo.Context) error {
	return c.JSON(http.StatusOK, postdb)
}

func logger(c echo.Context, v middleware.RequestLoggerValues) error {
	fmt.Printf("%v | %v | %v %v | ", v.StartTime.Format("2006-01-02 15:04:05"), v.RemoteIP, v.Method, v.URI)
	color := colorGreen
	if v.Status != 200 {
		color = colorRed
	}
	fmt.Printf("%v%v%v | %v\n", color, v.Status, colorReset, v.Latency)
	return nil
}

func createPost(c echo.Context) error {
	post := Post{}
	// error checking for valid json
	if err := c.Bind(&post); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	if post.ParentId != 0 {
		return c.JSON(http.StatusBadRequest, "post must be top level")
	}

	if post.ChildIds != nil {
		return c.JSON(http.StatusBadRequest, "post cannot have children")
	}

	post = Post{
		Id:       id,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
	}
	id = id + 1

	postdb[post.Id] = post
	return c.JSON(http.StatusOK, post)
}

func createComment(c echo.Context) error {
	post := Post{}
	// error checking for valid json
	if err := c.Bind(&post); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	if post.ParentId == 0 {
		return c.JSON(http.StatusBadRequest, "post must have parent")
	}

	if post.ChildIds != nil {
		return c.JSON(http.StatusBadRequest, "post cannot have children")
	}

	post = Post{
		Id:       id,
		ParentId: post.ParentId,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
	}
	id = id + 1

	var parent, ok = postdb[post.ParentId]
	if !ok {
		parent, ok = commentdb[post.ParentId]
		if !ok {
			return c.JSON(http.StatusBadRequest, "parent does not exist")
		}
	}
	parent.ChildIds = append(parent.ChildIds, post.Id)

	commentdb[post.Id] = post
	return c.JSON(http.StatusOK, post)
}
