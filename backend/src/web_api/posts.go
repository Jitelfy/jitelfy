package web_api

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
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
var BookmarkColl *mongo.Collection
var SOTDColl *mongo.Collection

type Post struct {
	Id       primitive.ObjectID   `json:"id" bson:"_id"`
	UserId   primitive.ObjectID   `json:"userid" bson:"userid"`
	ParentId primitive.ObjectID   `json:"parentid" bson:"parentid"`
	ChildIds int                  `json:"childids" bson:"childids"`
	LikeIds  []primitive.ObjectID `json:"likeIds" bson:"likeids"`
	Time     string               `json:"time" bson:"time"`
	Text     string               `json:"text" bson:"text"`
	Embed    string               `json:"embed" bson:"embed"`
	Song     string               `json:"song" bson:"song"`
	Repost   bool                 `json:"repost"`
	RepostDN string               `json:"repostDN"`
	RepostUser string             `json:"repostuser"`
}

type PostGroup struct {
	Id      primitive.ObjectID   `json:"id" bson:"_id"`
	UserId  primitive.ObjectID   `json:"userid" bson:"userid"`
	PostIds []primitive.ObjectID `json:"postids" bson:"postids"`
}

type PostUserPackage struct {
	Postjson Post     `json:"post"`
	Userjson BaseUser `json:"user"`
}

type CompleteSinglePost struct {
	Post     PostUserPackage   `json:"post"`
	Comments []PostUserPackage `json:"comments"`
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
			var user BaseUser
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
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

	if len(post.Text) > 280 {
		return c.JSON(http.StatusBadRequest, "post text too long")
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
		Repost:   false,
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

	// Convert song url to an embed
	if post.Song != "" {
		if strings.Contains(post.Song, "https://open.spotify.com/track/") {
			post.Song = strings.Replace(post.Song, "/track/", "/embed/track/", 1)
		} else if !strings.Contains(post.Song, "https://open.spotify.com/embed/track/") {
			return c.JSON(http.StatusBadRequest, "invalid song link")
		}
	}

	if len(post.Text) > 280 {
		return c.JSON(http.StatusBadRequest, "post text too long")
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
		LikeIds:  []primitive.ObjectID{},
		ChildIds: 0,
		UserId:   userId,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
		Repost:   false,
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
			var user BaseUser
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
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

func purgePost(post Post) error {
	post_filter := bson.D{{Key: "postids", Value: bson.D{{Key: "$elemMatch", Value: bson.D{{Key: "$eq", Value: post.Id}}}}}}
	update := bson.M{"$pull": bson.M{"postids": post.Id}}
	alert_filter := bson.D{{Key: "alerts", Value: bson.D{{Key: "$elemMatch", Value: bson.D{{Key: "postid", Value: post.Id}}}}}}
	alert_update := bson.M{"$pull": bson.M{"alerts": bson.D{{Key: "postid", Value: post.Id}}}}

	ch := make(chan int)

	go func() {
		_, err := BookmarkColl.UpdateMany(context.TODO(), post_filter, update)
		if err != nil {
			ch <- -1
		} else {
			ch <- 0
		}
	}()
	go func() {
		_, err := RepostColl.UpdateMany(context.TODO(), post_filter, update)
		if err != nil {
			ch <- -1
		} else {
			ch <- 0
		}
	}()
	go func() {
		_, err := AlertColl.UpdateOne(context.TODO(), alert_filter, alert_update)

		if err != nil {
			ch <- -1
		} else {
			ch <- 0
		}
	}()

	if <-ch == -1 {
		return errors.New("failed to purge post")
	}

	return nil
}

func DeletePost(c echo.Context) error {
	var Id, err = primitive.ObjectIDFromHex(c.QueryParam("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (postid)")
	}

	ch := make(chan int)

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

	go func() {
		if post.ParentId != primitive.NilObjectID {
			filter = bson.D{{Key: "_id", Value: post.ParentId}}
			change := bson.D{{Key: "$inc", Value: bson.D{{Key: "childids", Value: -1}}}}
			var update_result *mongo.UpdateResult
			update_result, err = PostColl.UpdateOne(context.TODO(), filter, change)
			if err != nil || update_result.MatchedCount == 0 {
				ch <- -1
			} else {
				ch <- 0
			}
		}
	}()

	go func() {
		err = purgePost(post)
		if err != nil {
			ch <- -1
		} else {
			ch <- 0
		}
	}()

	if post.ChildIds != 0 {
		filter = bson.D{{Key: "parentid", Value: post.Id}}
		var child_result *mongo.Cursor
		var child_posts []Post
		child_result, err = PostColl.Find(context.TODO(), filter)
		child_result.All(context.TODO(), &child_posts)
		for _, currpost := range child_posts {
			go func(currpost Post) {
				if err = purgePost(currpost); err != nil {
					ch <- -1
				} else {
					ch <- 0
				}
			}(currpost)
		}
		for range child_posts {
			if <-ch == -1 {
				return c.JSON(http.StatusInternalServerError, "failed to purge post")
			}
		}
		_, err = PostColl.DeleteMany(context.TODO(), filter)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, "failed to delete comments")
		}
	}

	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to delete post")
	}
	if post.ParentId != primitive.NilObjectID && <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to delete post")
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
	var liker User
	err = UserColl.FindOne(context.TODO(), bson.M{"_id": likerObjID}).Decode(&liker)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not like post")
	}
	// notification
	if liker.Id != liked.UserId {
		msg := fmt.Sprintf("%s liked you post", liker.Username)
		alert := Alert{
			AlerterId: likerObjID,
			PostID:    likedObjID,
			CreatedAt: time.Now(),
			Type:      "like",
			Message:   msg,
		}
		_, err = AlertColl.UpdateOne(context.TODO(), bson.M{"userid": liked.UserId}, bson.M{"$addToSet": bson.M{"alerts": alert}})
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}
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
	var bookmarks PostGroup
	err = BookmarkColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": bookmarker},
		bson.M{"$addToSet": bson.M{"postids": post}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&bookmarks)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not bookmark post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":                  "post bookmarked",
		"total bookmarks for user": strconv.Itoa(len(bookmarks.PostIds)),
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
	var bookmarks PostGroup
	err = BookmarkColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": bookmarker},
		bson.M{"$pull": bson.M{"postids": post}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&bookmarks)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not bookmark post")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":                  "post unbookmarked",
		"total bookmarks for user": strconv.Itoa(len(bookmarks.PostIds)),
	})
}

func GetBookmarks(c echo.Context) error {

	userid_str, _ := UserIdFromCookie(c)
	userid, err := primitive.ObjectIDFromHex(userid_str)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "could not get user from cookie")
	}

	filter := bson.D{{Key: "userid", Value: userid}}
	var result = BookmarkColl.FindOne(context.TODO(), filter)
	var bookmarks PostGroup
	if err := result.Decode(&bookmarks); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.JSON(http.StatusBadRequest, "could not find user")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	var packagedresults = make([]PostUserPackage, len(bookmarks.PostIds))
	var ch = make(chan *PostUserPackage)

	for _, post_id := range bookmarks.PostIds {
		go func(post_id primitive.ObjectID) {
			var postfilter = bson.D{{Key: "_id", Value: post_id}}
			var result = PostColl.FindOne(context.TODO(), postfilter)
			var post Post
			if post_err := result.Decode(&post); post_err != nil {
				ch <- nil
			}
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			result = UserColl.FindOne(context.TODO(), userfilter)
			var user BaseUser
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(post_id)
	}

	for idx := range bookmarks.PostIds {
		var packagedpost = <-ch
		// for now just ignore posts without users
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

func MakeRepost(c echo.Context) error {
	// Get post ID from url param
	userStrID, _ := UserIdFromCookie(c)
	userObjID, err := primitive.ObjectIDFromHex(userStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "couldn't get userid from cookie")
	}

	// Get post ID from URL parameter
	postStrID := c.Param("id")
	postObjID, err := primitive.ObjectIDFromHex(postStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (id)")
	}

	var repost PostGroup
	updateOpts := options.FindOneAndUpdate().SetReturnDocument(options.After).SetUpsert(true)
	err = RepostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": userObjID},
		bson.M{"$addToSet": bson.M{"postids": postObjID}},
		updateOpts,
	).Decode(&repost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not repost post: "+err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":                   "post reposted",
		"number of reposts by user": strconv.Itoa(len(repost.PostIds)),
	})
}

func DeleteRepost(c echo.Context) error {
	// Get user ID from cookie
	userStrID, _ := UserIdFromCookie(c)
	userObjID, err := primitive.ObjectIDFromHex(userStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "couldn't get userid from cookie")
	}

	// Get post ID from URL parameter
	postStrID := c.Param("id")
	postObjID, err := primitive.ObjectIDFromHex(postStrID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid parameter (id)")
	}

	var repost PostGroup
	updateOpts := options.FindOneAndUpdate().SetReturnDocument(options.After)

	err = RepostColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"userid": userObjID},
		bson.M{"$pull": bson.M{"postids": postObjID}},
		updateOpts,
	).Decode(&repost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not unrepost post: "+err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":                   "post unreposted",
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
	var reposts PostGroup
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
			var user BaseUser
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
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

	var userId, _ = primitive.ObjectIDFromHex(c.QueryParam("userid"))

	var user BaseUser
	UserColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: userId}}).Decode(&user)

	var cursor, _ = PostColl.Find(context.TODO(), bson.D{{Key: "userid", Value: userId}})
	var result []Post
	cursor.All(context.TODO(), &result)

	// Also fetch reposts for the user.
	var repostGroup PostGroup
	if RepostColl.FindOne(context.TODO(), bson.D{{Key: "userid", Value: userId}}).Decode(&repostGroup) == nil {
		for _, repId := range repostGroup.PostIds {
			var repPost Post
			if PostColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: repId}}).Decode(&repPost) == nil {
			    repPost.Repost = true // Indicate that this is a repost

			    // Specify the details of the user that reposted it
			    repPost.RepostDN =  user.DisplayName
			    repPost.RepostUser = user.Username

				result = append(result, repPost)
			}
		}
	}

	var packagedresults = make([]PostUserPackage, len(result))
	for i, currpost := range result {
		var postUser BaseUser
		// Use the fetched profile user if the post was created by them;
		// otherwise, fetch the original data from the og poster
		if currpost.UserId == user.Id {
			postUser = user
		} else {
			UserColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: currpost.UserId}}).Decode(&postUser)
		}
		packagedresults[i] = PostUserPackage{
			Userjson: postUser,
			Postjson: currpost,
		}
	}

	return c.JSON(http.StatusOK, packagedresults)
}

/* Struct to store the SOTD */
type SongOfTheDay struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Song        string             `bson:"song" json:"song"`
	LastUpdated time.Time          `bson:"lastUpdated" json:"lastUpdated"`
}

func GetSongOfTheDay(c echo.Context) error {

	var SOTD SongOfTheDay

	// This is just to initialise the time
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// If a song exists for today then just return it instantly
	//If the stored song's lastupdated is more than 24 hours, it fetches a new song
	if err := SOTDColl.FindOne(context.TODO(), bson.M{"lastUpdated": bson.M{"$gte": todayStart}}).Decode(&SOTD); err == nil {
		return c.JSON(http.StatusOK, SOTD)
	}

	// If not, then get all the posts that exist
	cursor, err := PostColl.Find(context.TODO(), bson.M{"song": bson.M{"$ne": ""}})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to fetch songs")
	}
	var posts []Post
	if err = cursor.All(context.TODO(), &posts); err != nil || len(posts) == 0 {
		return c.JSON(http.StatusInternalServerError, "no songs available")
	}

	// Pick one song at random as today's SOTD
	SOTD = SongOfTheDay{
		Song:        posts[rand.Intn(len(posts))].Song,
		LastUpdated: now,
	}
	if _, err := SOTDColl.InsertOne(context.TODO(), SOTD); err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to store song of the day")
	}

	// Return that randomly cohsen song
	return c.JSON(http.StatusOK, SOTD)
}

func GetAllPostsFromUserBackend(id primitive.ObjectID) []PostUserPackage {

	var userId = id

	var user BaseUser
	UserColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: userId}}).Decode(&user)

	var cursor, _ = PostColl.Find(context.TODO(), bson.D{{Key: "userid", Value: userId}, {Key: "parentid", Value: primitive.NilObjectID}})
	var result []Post
	cursor.All(context.TODO(), &result)

	// Also fetch reposts for the user. Add a flag that this post is a repost.
	var repostGroup PostGroup
	if RepostColl.FindOne(context.TODO(), bson.D{{Key: "userid", Value: userId}}).Decode(&repostGroup) == nil {
		for _, repId := range repostGroup.PostIds {
			var repPost Post
			if PostColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: repId}}).Decode(&repPost) == nil {

			    // Indicate that this is a repost
			    repPost.Repost = true;

			    // Specify the details of the user that reposted it
                repPost.RepostDN =  user.DisplayName
                repPost.RepostUser = user.Username

				result = append(result, repPost)
			}
		}
	}

	var packagedresults = make([]PostUserPackage, len(result))
	for i, currpost := range result {
		var postUser BaseUser
		// Use the fetched profile user if the post was created by them;
		// otherwise, fetch the original data from the og poster
		if currpost.UserId == user.Id {
			postUser = user
		} else {
			UserColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: currpost.UserId}}).Decode(&postUser)
		}
		packagedresults[i] = PostUserPackage{
			Userjson: postUser,
			Postjson: currpost,
		}
	}

	return packagedresults
}

// joe
func GetFeed(c echo.Context) error {
	var user User
	userStringID, err := UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to get string id from cookie")
	}
	userId, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to parse user id")
	}
	filter := bson.D{{Key: "_id", Value: userId}}
	result := UserColl.FindOne(context.TODO(), filter)
	err = result.Decode(&user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to parse user id")
	}
	feed := GetAllPostsFromUserBackend(user.Id)
	for _, followingID := range user.Following {
		for _, post := range GetAllPostsFromUserBackend(followingID) {
			feed = append(feed, post)
		}
	}
	return c.JSON(http.StatusOK, feed)
}
