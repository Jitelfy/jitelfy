package web_api

import (
	"context"
	"net/http"

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
	Icon        string               `json:"icon" bson:"icon"`
	Followers   []primitive.ObjectID `json:"followers" bson:"followers"`
	Following   []primitive.ObjectID `json:"following" bson:"following"`
}

var AccColl *mongo.Collection

type Account struct {
	User     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Username string             `json:"username" bson:"username"`
	Token    string             `json:"token" bson:"token"`
	Password string             `json:"password" bson:"password"`
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
		if err == mongo.ErrNoDocuments {
			return c.JSON(http.StatusBadRequest, "could not find user")
		} else {
			return c.JSON(http.StatusBadRequest, err.Error())
		}
	}

	return c.JSON(http.StatusOK, user)
}

func MakeUser(c echo.Context) error {
	req := struct {
		Username string `json:"username"`
		Password string `json:"password"`
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

	user := User{
		Id:        primitive.NewObjectID(),
		Username:  req.Username,
		Followers: []primitive.ObjectID{},
		Following: []primitive.ObjectID{},
	}

	_, err := UserColl.InsertOne(context.TODO(), user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create user")
	}

	encryptedPass, err := HashPassword(req.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "password hashing failed")
	}

	account := Account{
		User:     user.Id,
		Username: req.Username,
		Password: encryptedPass,
	}

	_, err = AccColl.InsertOne(context.TODO(), account)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to create account")
	}

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
	filter := bson.D{{"username", req.Username}}
	var result Account
	err := AccColl.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "incorrect username man")

	}
	err = VerifyPassword(result.Password, req.Password)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, "incorrect password")
	}

	return c.JSON(http.StatusOK, result)
}
