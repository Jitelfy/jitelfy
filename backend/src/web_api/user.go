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
	Id        primitive.ObjectID   `json:"id" bson:"_id"`
	Username  string               `json:"username" bson:"username"`
	Followers []primitive.ObjectID `json:"followers" bson:"followers"`
	Following []primitive.ObjectID `json:"following" bson:"following"`
}

func GetUser(c echo.Context) error {

	var userid, err = primitive.ObjectIDFromHex(c.QueryParam("userid"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, "invalid paramater (userid)")
	}

	filter := bson.D{{"_id", userid}}
	var result *mongo.SingleResult
	result = UserColl.FindOne(context.TODO(), filter)
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
	user := User{}
	// error checking for valid json
	if err := c.Bind(&user); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	if user.Username == "" {
		return c.JSON(http.StatusBadRequest, "user missing username")
	}

	user = User{
		Id:        primitive.NewObjectID(),
		Username:  user.Username,
		Followers: user.Followers,
		Following: user.Following,
	}

	var bsonuser, err = bson.Marshal(user)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "bson conversion failed")
	}
	_, err = UserColl.InsertOne(context.TODO(), bsonuser)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, user)
}
