package web_api

import (
	"context"
	"go.mongodb.org/mongo-driver/mongo/options"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var PostColl *mongo.Collection

type Post struct {
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

type PostUserPackage struct {
	Postjson Post `json:"post"`
	Userjson User `json:"user"`
}

/* I think this will be faster with many many posts but right now
is a bit slower than consuming the iterator

i.e. we may use this version once the time to get the entire post collection
becomes big enough that treating it as a stream will be faster
func GetPosts(c echo.Context) error {

	filter := bson.D{{Key: "parentid", Value: primitive.NilObjectID}}
	var cursor, err = PostColl.Find(context.TODO(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not retrieve posts")
	}
	defer func() {
		cursor.Close(context.TODO())
	}()

	var packagedresults []PostUserPackage

	var ch = make(chan *PostUserPackage)
	var count = 0

	for cursor.Next(context.TODO()) {
		var currpost Post
		count += 1
		if err = cursor.Decode(&currpost); err == nil {
			go func(post Post) {
				var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
				var result = UserColl.FindOne(context.TODO(), userfilter)
				var user User
				if user_err := result.Decode(&user); user_err != nil {
					ch <- nil
				}
				ch <- &PostUserPackage{
					Postjson: post,
					Userjson: user,
				}
			}(currpost)
		}
	}

	for i := 0; i < count; i++ {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults = append(packagedresults, *packagedpost)
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}
*/

func GetPosts(c echo.Context) error {

	filter := bson.D{{Key: "parentid", Value: primitive.NilObjectID}}
	var cursor, err = PostColl.Find(context.TODO(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not retrieve posts")
	}
	var result []Post
	err = cursor.All(context.TODO(), &result)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not parse posts")
	}

	var packagedresults = make([]PostUserPackage, len(result))

	var ch = make(chan *PostUserPackage)

	for _, currpost := range result {
		go func(post Post) {
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			var result = UserColl.FindOne(context.TODO(), userfilter)
			var user User
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			user.Password = ""
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(currpost)
	}

	for idx := range result {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

func CreatePost(c echo.Context) error {
	var post Post
	var err error

	// error checking for valid json
	if err = c.Bind(&post); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	if post.Song == "" {
		return c.JSON(http.StatusBadRequest, "top level posts must have song")
	}

	if !strings.Contains(post.Song, "https://open.spotify.com/track/") {
		return c.JSON(http.StatusBadRequest, "invalid song link")
	}

	var userId primitive.ObjectID

	if userId, err = primitive.ObjectIDFromHex(UserIdFromToken(c)); err != nil {
		return c.JSON(http.StatusBadRequest, "missing user token")
	}

	song := strings.Replace(post.Song, "/track/", "/embed/track/", 1)

	// Build the final Post object
	newPost := Post{
		Id:       primitive.NewObjectID(),
		UserId:   userId,
		ParentId: primitive.NilObjectID,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     song,
	}

	if newPost.ParentId != primitive.NilObjectID {
		return c.JSON(http.StatusBadRequest, "post must be top level")
	}
	if newPost.ChildIds != nil {
		return c.JSON(http.StatusBadRequest, "post cannot have children")
	}

	bsonPost, err := bson.Marshal(newPost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "bson conversion failed")
	}
	_, err = PostColl.InsertOne(context.TODO(), bsonPost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
	}

	return c.JSON(http.StatusOK, newPost)
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

	filter := bson.D{{Key: "parentid", Value: parentId}}
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

	var packagedresults = make([]PostUserPackage, len(result))

	var ch = make(chan *PostUserPackage)

	for _, currpost := range result {
		go func(post Post) {
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			var result = UserColl.FindOne(context.TODO(), userfilter)
			var user User
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			user.Password = ""
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(currpost)
	}

	for idx := range result {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

func DeletePost(c echo.Context) error {
	var Id, err = primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (postid)")
	}

	filter := bson.D{{"_id", Id}}
	var result *mongo.DeleteResult
	result, err = PostColl.DeleteOne(context.TODO(), filter)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not delete post")
	}

	return c.JSON(http.StatusOK, result)
}

func LikePost(c echo.Context) error {
	// liker
	likerStrID, _ := UserIdFromCookie(c)
	likerObjID, err := primitive.ObjectIDFromHex(likerStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liker)")
	}

	// liked
	likedStrID := c.Param("id")
	likedObjID, err := primitive.ObjectIDFromHex(likedStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liked)")
	}

	var liked Post
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": likedObjID},
		bson.M{"$addToSet": bson.M{"likeids": likerObjID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(liked)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not like post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post liked",
		"total post likes": strconv.Itoa(len(liked.LikeIds)),
	})
}

func UnlikePost(c echo.Context) error {
	likerStrID, _ := UserIdFromCookie(c)
	likerObjID, err := primitive.ObjectIDFromHex(likerStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liker)")
	}
	likedStrID := c.Param("id")
	likedObjID, err := primitive.ObjectIDFromHex(likedStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liked)")
	}
	var liked Post
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": likedObjID},
		bson.M{"$pull": bson.M{"likeids": likerObjID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(liked)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not unlike post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post unliked",
		"total post likes": strconv.Itoa(len(liked.LikeIds)),
	})
}
