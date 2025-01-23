package main

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)


type Post struct {
	// these ids structs will be replaced
	// with mongodb ids
	Id       primitive.ObjectID    `json:"id" bson:"_id"`
	UserId   int    `json:"userid" bson:"userid"`
	ParentId primitive.ObjectID    `json:"parentid" bson:"parentid"`
	ChildIds []primitive.ObjectID  `json:"childids" bson:"childids"`
	LikeIds  []int  `json:"likeids" bson:"likeids"`
	Time     string `json:"time" bson:"time"`
	Text     string `json:"text" bson:"text"`
	Embed    string `json:"embed" bson:"embed"`
	Song     string `json:"song" bson:"song"`
}

// need to figure out if comment and post ids should be separated
// if i want a way to get all top level posts, i think it makes the
// most sense to separate them but it makes all other purposes
// a bit more annoying having to check both maps
var postColl *mongo.Collection

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
	var db = client.Database("jitelfy")
	if err := db.RunCommand(context.TODO(),
		bson.D{{"ping", 1}}).Err(); err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("Jitelfy successfully connected to Cluster Server.")

	postColl = db.Collection("posts")

	router := echo.New()
	router.Debug = true
	router.GET("/posts/top", getPosts)
	router.GET("/posts/comments", getComments)
	router.POST("/posts/top", createPost)
	router.POST("/posts/comments", createComment)

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
	
	filter := bson.D{{"parentid", primitive.NilObjectID}}
	var cursor, err = postColl.Find(context.TODO(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not retrieve posts")
	}
	var result []Post
	err = cursor.All(context.TODO(), &result)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not parse posts")
	}

	return c.JSON(http.StatusOK, result)
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

	if post.ParentId != primitive.NilObjectID {
		return c.JSON(http.StatusBadRequest, "post must be top level")
	}

	if post.ChildIds != nil {
		return c.JSON(http.StatusBadRequest, "post cannot have children")
	}

	post = Post{
		Id:    	  primitive.NewObjectID(),
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
	}

	var bsonpost, err = bson.Marshal(post)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "bson conversion failed")
	}
	_, err = postColl.InsertOne(context.TODO(), bsonpost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
	}

	return c.JSON(http.StatusOK, post)
}

func createComment(c echo.Context) error {
	post := Post{}

	var parentId, err = primitive.ObjectIDFromHex(c.QueryParam("parent"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (parentid)")
	}

	// error checking for valid json
	if err := c.Bind(&post); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	if post.ChildIds != nil {
		return c.JSON(http.StatusBadRequest, "post cannot have children")
	}

	post = Post{
		Id:       primitive.NewObjectID(),
		ParentId: parentId,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
	}


	var bsonpost []byte 
	bsonpost, err = bson.Marshal(post)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "bson conversion failed")
	}
	_, err = postColl.InsertOne(context.TODO(), bsonpost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
	}

	return c.JSON(http.StatusOK, post)
}

func getComments(c echo.Context) error {

	var parentId, err = primitive.ObjectIDFromHex(c.QueryParam("parent"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (parentid)")
	}
	
	filter := bson.D{{"parentid", parentId}}
	var cursor *mongo.Cursor
	cursor, err = postColl.Find(context.TODO(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not retrieve posts")
	}
	var result []Post
	err = cursor.All(context.TODO(), &result)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not parse posts")
	}

	return c.JSON(http.StatusOK, result)
	
}
