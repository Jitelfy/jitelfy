package web_api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"strconv"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var UserColl *mongo.Collection

type BaseUser struct {
	Id          primitive.ObjectID `json:"id" bson:"_id"`
	DisplayName string             `json:"displayname" bson:"displayname"`
	Username    string             `json:"username" bson:"username"`
	Icon        int                `json:"icon" bson:"icon"`
}

type User struct {
	BaseUser       `bson:"inline"`
	Banner         int                  `json:"banner" bson:"banner"`
	Bio            string               `json:"bio" bson:"bio"`
	Song           string               `json:"song" bson:"song"`
	Followers      []primitive.ObjectID `json:"followers" bson:"followers"`
	Following      []primitive.ObjectID `json:"following" bson:"following"`
	Token          string               `json:"token" bson:"token"`
	SpotifyToken   string               `json:"spotify_token" bson:"spotify_token"`
	SpotifyRefresh string               `json:"spotify_refresh" bson:"spotify_refresh"`
	Password       string               `json:"-" bson:"password"`
}

type LoggedInUser struct {
	User      `bson:"inline"`
	Bookmarks []primitive.ObjectID `json:"bookmarks"`
	Reposts   []primitive.ObjectID `json:"reposts"`
	Alerts    []Alert              `json:"alerts"`
}

func GetUser(c echo.Context) error {

	param := c.Param("id")
	var filter bson.D

	// Try to interpret the param as an objectiD
	if objID, err := primitive.ObjectIDFromHex(param); err == nil {
		filter = bson.D{{Key: "_id", Value: objID}}
	} else {
		// Otherwise treat it as a username
		filter = bson.D{{Key: "username", Value: param}}
	}

	var result = UserColl.FindOne(context.TODO(), filter)
	var user User

	var err = result.Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.JSON(http.StatusBadRequest, "could not find user")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	return c.JSON(http.StatusOK, user)
}

func MakeUser(c echo.Context) error {
	req := struct {
		DisplayName string `json:"displayname"`
		Username    string `json:"username"`
		Password    string `json:"password"`
	}{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	valid_user := make(chan int)
	hash_complete := make(chan int)

	go func() {
		filter := bson.D{{Key: "username", Value: req.Username}}
		result := UserColl.FindOne(context.TODO(), filter)
		if result.Err() != mongo.ErrNoDocuments {
			valid_user <- -1
		} else {
			valid_user <- 0
		}
	}()

	var encryptedPass string
	var err error

	go func() {
		encryptedPass, err = HashPassword(req.Password)
		if err != nil {
			hash_complete <- -1
		} else {
			hash_complete <- 0
		}
	}()

	if len(req.DisplayName) > 40 {
		return c.JSON(http.StatusBadRequest, "Display name must be under 40 characters.")
	}

	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, "Username is required.")
	}
	if len(req.Username) > 20 || len(req.Username) < 3 {
		return c.JSON(http.StatusBadRequest, "Username must be between 3 and 20 characters.")
	}

	if req.Password == "" {
		return c.JSON(http.StatusBadRequest, "Password is required.")
	}
	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, "Password must be at least 8 characters.")
	}

	if <-valid_user == -1 {
		return c.JSON(http.StatusForbidden, "User with this username already exists.")
	}

	if <-hash_complete == -1 { //  we should not tell them the reason it failed emily
		return c.JSON(http.StatusInternalServerError, "Failed to create account.")
	}

	user := User{
		BaseUser: BaseUser{
			Id:          primitive.NewObjectID(),
			DisplayName: req.DisplayName,
			Username:    req.Username,
		},
		Followers: []primitive.ObjectID{},
		Following: []primitive.ObjectID{},
		Password:  encryptedPass,
	}
	userAlerts := UserAlerts{
		Id:     primitive.NewObjectID(),
		UserId: user.Id,
		Alert:  []Alert{},
	}

	repost := PostGroup{
		Id:      primitive.NewObjectID(),
		UserId:  user.Id,
		PostIds: []primitive.ObjectID{},
	}

	bookmark := PostGroup{
		Id:      primitive.NewObjectID(),
		UserId:  user.Id,
		PostIds: []primitive.ObjectID{},
	}
	_, err = UserColl.InsertOne(context.TODO(), user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Failed to create user.")
	}
	_, err = AlertColl.InsertOne(context.TODO(), userAlerts)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Failed to create alerts.")
	}
	_, err = RepostColl.InsertOne(context.TODO(), repost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Failed to create repost documents.")
	}
	_, err = BookmarkColl.InsertOne(context.TODO(), bookmark)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "Failed to create bookmark documents.")
	}

	user.Password = ""

	return c.JSON(http.StatusOK, user)
}

const (
	INVALID_USERNAME = iota + 1
	INVALID_PASSWORD
	NO_TOKEN
	BAD_USERID
	BAD_PW
	NO_BOOKMARKS
	NO_REPOSTS
	NO_ALERTS
	TOKEN_SUCCESS
)

func Login(c echo.Context) error {
	req := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}
	var result LoggedInUser
	var bookmarksResult PostGroup
	var repostsResult PostGroup
	var alertsResult UserAlerts
	var ch = make(chan int)
	var userid_ch = make(chan int)
	var pw_ch = make(chan int)

	go func() {
		pw := <-pw_ch
		if pw == -1 {
			ch <- BAD_PW
			return
		}
		err := VerifyPassword(result.Password, req.Password)
		if err != nil {
			ch <- INVALID_PASSWORD
			return
		}
		ch <- 0
	}()

	go func() {
		userid := <-userid_ch
		if userid == -1 {
			ch <- BAD_USERID
			return
		}
		filter := bson.D{{Key: "userid", Value: result.Id}}
		err := BookmarkColl.FindOne(context.TODO(), filter).Decode(&bookmarksResult)
		if err != nil {
			ch <- NO_BOOKMARKS
			return
		}
		result.Bookmarks = bookmarksResult.PostIds
		ch <- 0
	}()

	go func() {
		userid := <-userid_ch
		if userid == -1 {
			ch <- BAD_USERID
			return
		}
		filter := bson.D{{Key: "userid", Value: result.Id}}
		err := RepostColl.FindOne(context.TODO(), filter).Decode(&repostsResult)
		if err != nil {
			ch <- NO_REPOSTS
			return
		}
		result.Reposts = repostsResult.PostIds
		ch <- 0
	}()

	// should i get alerts too?
	go func() {
		userid := <-userid_ch
		if userid == -1 {
			ch <- BAD_USERID
			return
		}
		filter := bson.D{{Key: "userid", Value: result.Id}}
		err := AlertColl.FindOne(context.TODO(), filter).Decode(&alertsResult)
		if err != nil {
			ch <- NO_ALERTS
			return
		}
		result.Alerts = alertsResult.Alert
		ch <- 0
	}()

	go func() {
		filter := bson.D{{Key: "username", Value: req.Username}}
		err := UserColl.FindOne(context.TODO(), filter).Decode(&result.User)
		if err != nil {
			ch <- INVALID_USERNAME
			userid_ch <- -1
			userid_ch <- -1
			userid_ch <- -1
			pw_ch <- -1
			return
		}
		userid_ch <- 0
		userid_ch <- 0
		userid_ch <- 0
		pw_ch <- 0
		// generate token
		result.Token, err = createToken(result.Username, result.Id)
		if err != nil {
			ch <- NO_TOKEN
			return
		}
		ch <- TOKEN_SUCCESS
	}()

	for i := 0; i < 5; i++ {
		switch errCode := <-ch; errCode {
		case INVALID_USERNAME:
			return c.JSON(http.StatusUnauthorized, "Invalid username.")
		case INVALID_PASSWORD:
			return c.JSON(http.StatusUnauthorized, "Invalid password.")
		case BAD_PW:
			return c.JSON(http.StatusUnauthorized, "Invalid password.")
		case BAD_USERID:
			return c.JSON(http.StatusUnauthorized, "Invalid username.")
		case NO_TOKEN: // if token validation failed it should probably be considered the same way
			return c.JSON(http.StatusUnauthorized, "Token validation failed.")
		case NO_BOOKMARKS:
			return c.JSON(http.StatusInternalServerError, "Internal server error (NO_BOOKMARKS)")
		case NO_ALERTS:
			return c.JSON(http.StatusInternalServerError, "Internal server error (NO_ALERTS)")
		case NO_REPOSTS:
			return c.JSON(http.StatusInternalServerError, "Internal server error (NO_REPOSTS)")
		case 0:
		}
	}

	result.Password = ""
	c.SetCookie(&http.Cookie{
		Name:     "Authorization",
		Value:    result.Token,
		Expires:  time.Now().Add(time.Hour * 72),
		Path:     "/",
		HttpOnly: true,
	})

	return c.JSON(http.StatusOK, result)
}

// idk if there needs to be more to this but it might actually just be this
func Logout(c echo.Context) error {

	c.SetCookie(&http.Cookie{
		Name:     "Authorization",
		Value:    "",
		Expires:  time.Now(),
		Path:     "/",
		HttpOnly: true,
	})

	return c.String(http.StatusOK, "success")
}

func RestoreUserFromCookie(c echo.Context) error {

	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	var bookmarksResult PostGroup
	var repostsResult PostGroup
	var alertsResult UserAlerts
	var result LoggedInUser
	ch := make(chan int)

	filter := bson.D{{Key: "userid", Value: userid}}
	go func() {
		err := BookmarkColl.FindOne(context.TODO(), filter).Decode(&bookmarksResult)
		if err != nil {
			ch <- NO_BOOKMARKS
			return
		}
		result.Bookmarks = bookmarksResult.PostIds
		ch <- 0
	}()

	go func() {
		err := RepostColl.FindOne(context.TODO(), filter).Decode(&repostsResult)
		if err != nil {
			ch <- NO_REPOSTS
			return
		}
		result.Reposts = repostsResult.PostIds
		ch <- 0
	}()

	go func() {
		err := AlertColl.FindOne(context.TODO(), filter).Decode(&alertsResult)
		if err != nil {
			ch <- NO_ALERTS
			return
		}
		result.Alerts = alertsResult.Alert
		ch <- 0
	}()

	go func() {
		user_filter := bson.D{{Key: "_id", Value: userid}}
		err := UserColl.FindOne(context.TODO(), user_filter).Decode(&result.User.BaseUser)
		if err != nil {
			ch <- INVALID_USERNAME
			return
		}
		ch <- 0
	}()

	for i := 0; i < 4; i++ {
		switch errCode := <-ch; errCode {
		case INVALID_USERNAME:
		case INVALID_PASSWORD:
		case BAD_USERID:
		case NO_TOKEN: // if token validation failed it should probably be considered the same way
			return c.JSON(http.StatusUnauthorized, "invalid username/password")
		case NO_BOOKMARKS:
			return c.JSON(http.StatusInternalServerError, "could not get bookmarks")
		case NO_ALERTS:
			return c.JSON(http.StatusInternalServerError, "could not get alerts")
		case NO_REPOSTS:
			return c.JSON(http.StatusInternalServerError, "could not get alerts")
		case 0:
		}
	}

	result.Password = ""

	return c.JSON(http.StatusOK, result)
}

func UserIdFromCookie(c echo.Context) (string, error) {
	var cookie, err = c.Cookie("Authorization")
	if err != nil {
		return "", errors.New("failed to get token from cookie")
	}

	var tokenString = cookie.Value
	var token *jwt.Token
	token, err = jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
		return SecretKey, nil
	})

	if err != nil {
		return "", errors.New("failed to get parse token")
	}
	return token.Claims.(jwt.MapClaims)["id"].(string), nil
}

func UserIdFromToken(c echo.Context) string {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	return claims["id"].(string)
}

func FollowUser(c echo.Context) error {

	// calling user
	userStringID, _ := UserIdFromCookie(c)
	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	// user to follow
	followStringID := c.Param("id")
	followObjectID, err := primitive.ObjectIDFromHex(followStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	// lol
	if followObjectID == userObjectID {
		return c.JSON(http.StatusForbidden, "you can't follow yourself")
	}

	var ch = make(chan int)
	// update DB
	var user User
	go func() {
		err = UserColl.FindOneAndUpdate(
			context.TODO(),
			bson.M{"_id": userObjectID},
			bson.M{"$addToSet": bson.M{"following": followObjectID}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		).Decode(&user)
		if err != nil {
			ch <- -1
		}
		ch <- 0
	}()
	var follow User
	go func() {
		err = UserColl.FindOneAndUpdate(
			context.TODO(),
			bson.M{"_id": followObjectID},
			bson.M{"$addToSet": bson.M{"followers": userObjectID}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		).Decode(&follow)
		if err != nil {
			ch <- -1
		}
		ch <- 0
	}()

	go func() {
		// notification
		alert := Alert{
			AlerterId: userObjectID,
			CreatedAt: time.Now(),
			Type:      "follow",
		}
		_, err = AlertColl.UpdateOne(context.TODO(), bson.M{"userid": followObjectID}, bson.M{"$addToSet": bson.M{"alerts": alert}})
		if err != nil {
			ch <- -1
		}
		ch <- 0
	}()

	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to follow")
	}
	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to follow")
	}
	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to alert")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "followed user",
		"user following":   strconv.Itoa(len(user.Following)),
		"target followers": strconv.Itoa(len(follow.Followers)),
	})
}

func UnfollowUser(c echo.Context) error {
	userStringID, _ := UserIdFromCookie(c)
	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	unfollowStringID := c.Param("id")
	unfollowObjectID, err := primitive.ObjectIDFromHex(unfollowStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	if unfollowObjectID == userObjectID {
		return c.JSON(http.StatusForbidden, "you can't unfollow yourself")
	}
	// update DB
	var user User
	var follow User
	var ch = make(chan int)
	go func() {
		err = UserColl.FindOneAndUpdate(
			context.TODO(),
			bson.M{"_id": userObjectID},
			bson.M{"$pull": bson.M{"following": unfollowObjectID}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		).Decode(&user)
		if err != nil {
			ch <- -1
		}
		ch <- 0
	}()
	go func() {
		err = UserColl.FindOneAndUpdate(
			context.TODO(),
			bson.M{"_id": unfollowObjectID},
			bson.M{"$pull": bson.M{"followers": userObjectID}},
			options.FindOneAndUpdate().SetReturnDocument(options.After),
		).Decode(&follow)
		if err != nil {
			ch <- -1
		}
		ch <- 0
	}()

	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to unfollow")
	}
	if <-ch == -1 {
		return c.JSON(http.StatusInternalServerError, "failed to unfollow")
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "unfollowed user",
		"user following":   strconv.Itoa(len(user.Following)),
		"target followers": strconv.Itoa(len(follow.Followers)),
	})
}
