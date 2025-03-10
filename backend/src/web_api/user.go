package web_api

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"strconv"
)

var UserColl *mongo.Collection

type User struct {
	Id          primitive.ObjectID   `json:"id" bson:"_id"`
	DisplayName string               `json:"displayname" bson:"displayname"`
	Username    string               `json:"username" bson:"username"`
	Icon        int                  `json:"icon" bson:"icon"`
	Banner      int                  `json:"banner" bson:"banner"`
	Bio         string               `json:"bio" bson:"bio"`
	Song        string               `json:"song" bson:"song"`
	Followers   []primitive.ObjectID `json:"followers" bson:"followers"`
	Following   []primitive.ObjectID `json:"following" bson:"following"`
	Bookmarks   []primitive.ObjectID `json:"bookmarks" bson:"bookmarks"`
	Token       string               `json:"token" bson:"token"`
	Password    string               `json:"password" bson:"password"`
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

	if req.Username == "" {
		return c.JSON(http.StatusBadRequest, "username is required")
	}
	if req.Password == "" {
		return c.JSON(http.StatusBadRequest, "password is required")
	}

	encryptedPass, err := HashPassword(req.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "password hashing failed")
	}

	user := User{
		Id:          primitive.NewObjectID(),
		DisplayName: req.DisplayName,
		Username:    req.Username,
		Followers:   []primitive.ObjectID{},
		Following:   []primitive.ObjectID{},
		Password:    encryptedPass,
	}
	userAlerts := UserAlerts{
		Id:     primitive.NewObjectID(),
		UserId: user.Id,
		Alert:  []Alert{},
	}
	_, err = UserColl.InsertOne(context.TODO(), user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create user")
	}

	_, err = AlertColl.InsertOne(context.TODO(), userAlerts)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create alert")
	}

	user.Password = ""

	return c.JSON(http.StatusOK, user)
}

func Login(c echo.Context) error {
	req := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{}
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}
	filter := bson.D{{Key: "username", Value: req.Username}}
	var result User
	err := UserColl.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "incorrect username man")
	}
	err = VerifyPassword(result.Password, req.Password)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, "incorrect password")
	}
	// generate token
	result.Token, err = createToken(result.Username, result.Id)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create token")
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

	filter := bson.D{{Key: "_id", Value: userid}}
	var result = UserColl.FindOne(context.TODO(), filter)
	var user User
	if err = result.Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return c.JSON(http.StatusBadRequest, "could not find user")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	return c.JSON(http.StatusOK, user)

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

	// Make sure the actual arrays themselves are null
	UserColl.UpdateOne(context.TODO(),
		bson.M{"_id": userObjectID, "following": bson.M{"$type": "null"}},
		bson.M{"$set": bson.M{"following": []primitive.ObjectID{}}},
	)
	UserColl.UpdateOne(context.TODO(),
		bson.M{"_id": followObjectID, "followers": bson.M{"$type": "null"}},
		bson.M{"$set": bson.M{"followers": []primitive.ObjectID{}}},
	)

	// update DB
	var user User
	var follow User
	err = UserColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": userObjectID},
		bson.M{"$addToSet": bson.M{"following": followObjectID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	err = UserColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": followObjectID},
		bson.M{"$addToSet": bson.M{"followers": userObjectID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&follow)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	// notification
	msg := fmt.Sprintf("Followed by %s", user.Username)
	alert := Alert{
		AlerterId: userObjectID,
		CreatedAt: time.Now(),
		Type:      "follow",
		Message:   msg,
	}
	_, err = AlertColl.UpdateOne(context.TODO(), bson.M{"userid": followObjectID}, bson.M{"$addToSet": bson.M{"alerts": alert}})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
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

	// Make sure the actual arrays themselves are NOT null
	UserColl.UpdateOne(context.TODO(),
		bson.M{"_id": userObjectID, "following": bson.M{"$type": "null"}},
		bson.M{"$set": bson.M{"following": []primitive.ObjectID{}}},
	)
	UserColl.UpdateOne(context.TODO(),
		bson.M{"_id": unfollowObjectID, "followers": bson.M{"$type": "null"}},
		bson.M{"$set": bson.M{"followers": []primitive.ObjectID{}}},
	)

	// update DB
	var user User
	var follow User
	err = UserColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": userObjectID},
		bson.M{"$pull": bson.M{"following": unfollowObjectID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	err = UserColl.FindOneAndUpdate(
		context.TODO(),
		bson.M{"_id": unfollowObjectID},
		bson.M{"$pull": bson.M{"followers": userObjectID}},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&follow)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{
		"message":          "unfollowed user",
		"user following":   strconv.Itoa(len(user.Following)),
		"target followers": strconv.Itoa(len(follow.Followers)),
	})
}
