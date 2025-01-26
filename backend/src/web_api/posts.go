package web_api

import (
	"context"
	"net/http"
	"time"
	"strings"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var PostColl *mongo.Collection

type Post struct {
	// these ids structs will be replaced
	// with mongodb ids
	Id       primitive.ObjectID   `json:"id" bson:"_id"`
	UserId   primitive.ObjectID   `json:"userid" bson:"userid"`
	ParentId primitive.ObjectID   `json:"parentid" bson:"parentid"`
	ChildIds []primitive.ObjectID `json:"childids" bson:"childids"`
	LikeIds  []primitive.ObjectID `json:"likeids" bson:"likeids"`
	Time     string               `json:"time" bson:"time"`
	Text     string               `json:"text" bson:"text"`
	Embed    string               `json:"embed" bson:"embed"`
	Song     string               `json:"song" bson:"song"`
}

func GetPosts(c echo.Context) error {

	filter := bson.D{{"parentid", primitive.NilObjectID}}
	var cursor, err = PostColl.Find(context.TODO(), filter)
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

func CreatePost(c echo.Context) error {
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

	if post.UserId == primitive.NilObjectID {
		return c.JSON(http.StatusBadRequest, "post must have user associated")
	}

	if post.Song == "" {
		return c.JSON(http.StatusBadRequest, "top level posts must have song")
	}
	var song = post.Song
	if !strings.Contains(song, "https://open.spotify.com/track/") {
		return c.JSON(http.StatusBadRequest, "invalid song link")
	}
	song = strings.Replace(song, "/track/", "/embed/track/", 1)

	post = Post{
		Id:     primitive.NewObjectID(),
		UserId: post.UserId,
		Time:   time.Now().Format(time.RFC3339),
		Text:   post.Text,
		Embed:  post.Embed,
		Song:   post.Song,
	}

	var bsonpost, err = bson.Marshal(post)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "bson conversion failed")
	}
	_, err = PostColl.InsertOne(context.TODO(), bsonpost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
	}

	return c.JSON(http.StatusOK, post)
}

func CreateComment(c echo.Context) error {
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
		UserId:   post.UserId,
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
	_, err = PostColl.InsertOne(context.TODO(), bsonpost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
	}

	return c.JSON(http.StatusOK, post)
}

func GetComments(c echo.Context) error {

	var parentId, err = primitive.ObjectIDFromHex(c.QueryParam("parent"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (parentid)")
	}

	filter := bson.D{{"parentid", parentId}}
	var cursor *mongo.Cursor
	cursor, err = PostColl.Find(context.TODO(), filter)
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
