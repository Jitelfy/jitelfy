package web_api

import (
	"context"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"net/http"
	"time"
)

var AlertColl *mongo.Collection

type Alert struct {
	AlerterId primitive.ObjectID `bson:"_id"`
	PostID    primitive.ObjectID `bson:"postid"`
	CreatedAt time.Time          `json:"created_at"`
	Type      string             `json:"type"`
	Message   string             `json:"message"`
}
type UserAlerts struct {
	Id     primitive.ObjectID `json:"id" bson:"_id"`
	UserId primitive.ObjectID `json:"userid" bson:"userid"`
	Alert  []Alert            `json:"alerts" bson:"alerts"`
}

func GetUserAlerts(c echo.Context) error {
	userStringID, _ := UserIdFromCookie(c)
	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not parse user id")
	}

	filter := bson.M{"userid": userObjectID}
	var userAlerts UserAlerts
	err = AlertColl.FindOne(context.Background(), filter).Decode(&userAlerts)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "could not find alerts")
	}
	return c.JSON(http.StatusOK, userAlerts)
}
