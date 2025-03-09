package web_api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var UserColl *mongo.Collection

type User struct {
	Id          primitive.ObjectID   `json:"id" bson:"_id"`
	DisplayName string               `json:"displayname" bson:"displayname"`
	Username    string               `json:"username" bson:"username"`
	Icon        int                  `json:"icon" bson:"icon"`
	Followers   []primitive.ObjectID `json:"followers" bson:"followers"`
	Following   []primitive.ObjectID `json:"following" bson:"following"`
	Token       string               `json:"token" bson:"token"`
	Password    string               `json:"password" bson:"password"`
}

func GetUser(c echo.Context) error {

	var userid, err = primitive.ObjectIDFromHex(c.QueryParam("userid"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (userid)")
	}

	filter := bson.D{{"_id", userid}}
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

	_, err = UserColl.InsertOne(context.TODO(), user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create user")
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

<<<<<<< HEAD
func SetIcon(c echo.Context) error {

	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)

	req := struct {
		Icon int `json:"icon"`
	}{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "icon", Value: req.Icon}}
	_, err = UserColl.UpdateByID(context.TODO(), filter, change)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to update icon")
	}

	return c.JSON(http.StatusBadRequest, "unimplemented method")

// idk if there needs to be more to this but it might actually just be this
func Logout(c echo.Context) error {

	c.SetCookie(&http.Cookie{
		Name: "Authorization",
		Value: "",
		Expires: time.Now(),
		Path: "/",
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
	token, err = jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
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
