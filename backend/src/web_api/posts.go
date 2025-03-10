package web_api

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var PostColl *mongo.Collection
var RepostColl *mongo.Collection

type Post struct {
	Id       primitive.ObjectID   `json:"id" bson:"_id"`
	UserId   primitive.ObjectID   `json:"userid" bson:"userid"`
	ParentId primitive.ObjectID   `json:"parentid" bson:"parentid"`
	ChildIds int `json:"childids" bson:"childids"`
	LikeIds  []primitive.ObjectID `json:"likeIds" bson:"likeids"`
	Time     string               `json:"time" bson:"time"`
	Text     string               `json:"text" bson:"text"`
	Embed    string               `json:"embed" bson:"embed"`
	Song     string               `json:"song" bson:"song"`
}

type Repost struct {
	Id       primitive.ObjectID   `json:"id" bson:"_id"`
	UserId   primitive.ObjectID   `json:"userid" bson:"userid"`
	PostIds  []primitive.ObjectID `json:"postids" bson:"postids"`
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

	// this is not evena  stream bruh
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
	song := strings.Replace(post.Song, "/track/", "/embed/track/", 1)

	var userId primitive.ObjectID

	if userId, err = primitive.ObjectIDFromHex(UserIdFromToken(c)); err != nil {
		return c.JSON(http.StatusBadRequest, "missing user token")
	}

	// Build the final Post object
	newPost := Post{
		Id:       primitive.NewObjectID(),
		UserId:   userId,
		ParentId: primitive.NilObjectID,
		LikeIds:  []primitive.ObjectID{},
		ChildIds: 0,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     song,
	}

	if newPost.ParentId != primitive.NilObjectID {
		return c.JSON(http.StatusBadRequest, "post must be top level")
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
        return c.JSON(http.StatusBadRequest, "invalid parameter (parentid)")
    }

    // Bind the incoming JSON
    if err := c.Bind(&post); err != nil {
        return c.JSON(http.StatusBadRequest, "invalid json")
    }

    // Conver song url to an embed
    if post.Song != "" {
        if strings.Contains(post.Song, "https://open.spotify.com/track/") {
            post.Song = strings.Replace(post.Song, "/track/", "/embed/track/", 1)
        } else if !strings.Contains(post.Song, "https://open.spotify.com/embed/track/") {
            return c.JSON(http.StatusBadRequest, "invalid song link")
        }
    }

    // Get the user ID from the token
    userIdHex := UserIdFromToken(c)
    userId, err := primitive.ObjectIDFromHex(userIdHex)
    if err != nil {
        return c.JSON(http.StatusBadRequest, "invalid user token")
    }

    // Build the new Post object with the converted song URL
    newComment := Post{
        Id:       primitive.NewObjectID(),
        ParentId: parentId,
		ChildIds: 0,
        UserId:   userId,
        Time:     time.Now().Format(time.RFC3339),
        Text:     post.Text,
        Embed:    post.Embed,
        Song:     post.Song,
    }

    // Marshal and insert into the database
    bsonpost, err := bson.Marshal(newComment)
    if err != nil {
        return c.JSON(http.StatusInternalServerError, "bson conversion failed")
    }
    _, err = PostColl.InsertOne(context.TODO(), bsonpost)
    if err != nil {
        return c.JSON(http.StatusInternalServerError, "failed to insert post to db")
    }
	filter := bson.D{{Key: "_id", Value: parentId}}
	change := bson.D{{Key: "$inc", Value: bson.D{{Key: "childids", Value: 1}}}}
	var result *mongo.UpdateResult
	result, err = PostColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update parent")
	}

    return c.JSON(http.StatusOK, newComment)
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

	userStrID, _ := UserIdFromCookie(c)
	userObjID, err := primitive.ObjectIDFromHex(userStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "could not get user from cookie")
	}

	filter := bson.D{{Key: "$and", Value: []bson.D{
		{{Key: "_id", Value: Id}},
		{{Key: "userid", Value: userObjID}},
	}}}
	var result *mongo.SingleResult
	result = PostColl.FindOneAndDelete(context.TODO(), filter)
	var post Post
	err = result.Decode(&post)
	if err != nil {
		return c.JSON(http.StatusForbidden, "not allowed to delete this post")
	}

	if (post.ParentId != primitive.NilObjectID) {
		filter = bson.D{{Key: "_id", Value: post.ParentId}}
		change := bson.D{{Key: "$inc", Value: bson.D{{Key: "childids", Value: -1}}}}
		var update_result *mongo.UpdateResult
		update_result, err = PostColl.UpdateOne(context.TODO(), filter, change)
		if err != nil || update_result.MatchedCount == 0 {
			return c.JSON(http.StatusInternalServerError, "failed to update parent")
		}
	}

	return c.JSON(http.StatusOK, result)
}

func LikePost(c echo.Context) error {
	// liker
	likerStrID, _ := UserIdFromCookie(c)
	likerObjID, err := primitive.ObjectIDFromHex(likerStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (liker)")
	}

	// liked
	likedStrID := c.Param("id")
	likedObjID, err := primitive.ObjectIDFromHex(likedStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (liked)")
	}

	var liked Post
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": likedObjID},
		bson.M{"$addToSet": bson.M{"likeids": likerObjID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&liked)
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
	).Decode(&liked)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not unlike post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post unliked",
		"total post likes": strconv.Itoa(len(liked.LikeIds)),
	})
}

func BookmarkPost(c echo.Context) error {
	bookmarkerID, _ := UserIdFromCookie(c)
	bookmarker, err := primitive.ObjectIDFromHex(bookmarkerID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liker)")
	}
	postID := c.Param("id")
	post, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liked)")
	}
	var user User
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": bookmarker},
		bson.M{"$addToSet": bson.M{"bookmarks": post}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not bookmark post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post bookmarked",
		"total post likes": strconv.Itoa(len(user.Bookmarks)),
	})
}

func UnbookmarkPost(c echo.Context) error {
	bookmarkerID, _ := UserIdFromCookie(c)
	bookmarker, err := primitive.ObjectIDFromHex(bookmarkerID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liker)")
	}
	postID := c.Param("id")
	post, err := primitive.ObjectIDFromHex(postID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (liked)")
	}
	var user User
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": bookmarker},
		bson.M{"$pull": bson.M{"bookmarks": post}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not bookmark post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post bookmarked",
		"total post likes": strconv.Itoa(len(user.Bookmarks)),
	})
}

func GetBookmarks(c echo.Context) error {

	userid_str, _ := UserIdFromCookie(c)
	userid, err := primitive.ObjectIDFromHex(userid_str)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "could not get user from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	var result = UserColl.FindOne(context.TODO(), filter)
	var user User
	if err := result.Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.JSON(http.StatusBadRequest, "could not find user")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	var packagedresults = make([]PostUserPackage, len(user.Bookmarks))
	var ch = make(chan *PostUserPackage)

	for _, post_id := range user.Bookmarks {
		go func(post_id primitive.ObjectID) {
			var postfilter = bson.D{{Key: "_id", Value: post_id}}
			var result = PostColl.FindOne(context.TODO(), postfilter)
			var post Post
			if post_err := result.Decode(&post); post_err != nil {
				ch <- nil
			}
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			result = UserColl.FindOne(context.TODO(), userfilter)
			var user User
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			user.Password = ""
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(post_id)
	}

	for idx := range user.Bookmarks {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

func MakeRepost(c echo.Context) error {
	// liker
	userStrID, _ := UserIdFromCookie(c)
	userObjID, err := primitive.ObjectIDFromHex(userStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "couldn't get userid from cookie")
	}

	// liked
	postStrID := c.Param("id")
	postObjID, err := primitive.ObjectIDFromHex(postStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (id)")
	}

	var repost Repost
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": userObjID},
		bson.M{"$addToSet": bson.M{"postids": postObjID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&repost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not repost post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post reposted",
		"number of reposts by user": strconv.Itoa(len(repost.PostIds)),
	})
}


func DeleteRepost(c echo.Context) error {
	// liker
	userStrID, _ := UserIdFromCookie(c)
	userObjID, err := primitive.ObjectIDFromHex(userStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "couldn't get userid from cookie")
	}

	// liked
	postStrID := c.Param("id")
	postObjID, err := primitive.ObjectIDFromHex(postStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (id)")
	}

	var repost Repost
	err = PostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": userObjID},
		bson.M{"$pull": bson.M{"postids": postObjID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&repost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not unrepost post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "post unreposted",
		"number of reposts by user": strconv.Itoa(len(repost.PostIds)),
	})
}

func GetAllReposts(c echo.Context) error {
	userid_str := c.Param("id")
	userid, err := primitive.ObjectIDFromHex(userid_str)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (id)")
	}

	filter := bson.D{{Key: "userid", Value: userid}}
	var result = RepostColl.FindOne(context.TODO(), filter)
	var reposts Repost
	if err := result.Decode(&reposts); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.JSON(http.StatusBadRequest, "could not find user repost document")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	var packagedresults = make([]PostUserPackage, len(reposts.PostIds))
	var ch = make(chan *PostUserPackage)

	for _, post_id := range reposts.PostIds {
		go func(post_id primitive.ObjectID) {
			var postfilter = bson.D{{Key: "_id", Value: post_id}}
			var result = PostColl.FindOne(context.TODO(), postfilter)
			var post Post
			if post_err := result.Decode(&post); post_err != nil {
				ch <- nil
			}
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			result = UserColl.FindOne(context.TODO(), userfilter)
			var user User
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			user.Password = ""
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(post_id)
	}

	for idx := range reposts.PostIds {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

func GetAllPostsFromUser(c echo.Context) error {

	var userId, err = primitive.ObjectIDFromHex(c.QueryParam("userid"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (userid)")
	}

	var user User
	filter := bson.D{{Key: "_id", Value: userId}}
	user_result := UserColl.FindOne(context.TODO(), filter)
	if err := user_result.Decode(&user); err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to get user")
	}
	user.Password = ""
	user.Bookmarks = nil

	filter = bson.D{{Key: "userid", Value: userId}}
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

	for i, currpost := range result {
		packagedresults[i] = PostUserPackage{
			Userjson: user,
			Postjson: currpost,
		}
	}

	return c.JSON(http.StatusOK, packagedresults)


}
