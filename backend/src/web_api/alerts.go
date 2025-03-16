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
	AlerterId primitive.ObjectID `bson:"userid"`
	PostID    primitive.ObjectID `bson:"postid"`
	CreatedAt time.Time          `json:"created_at"`
	Type      string             `json:"type"`
	Message   string             `json:"message"`
}

type AlertWithUser struct {
	Alert `bson:"inline"`
	PostUserPackage `bson:"inline"`
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

	results := make([]AlertWithUser, len(userAlerts.Alert))
	ch := make(chan int)
	
	for i, alert := range userAlerts.Alert {
		results[i].Alert = alert

		go func(idx int, alert Alert) {
			filter := bson.M{"_id": alert.AlerterId}
			var user BaseUser
			err = UserColl.FindOne(context.Background(), filter).Decode(&user)
			if err != nil {
				ch <- -1
				return
			}
			results[idx].Userjson = user
			ch <- 0
		}(i, alert)

		go func(idx int, alert Alert) { // get post
			if (alert.PostID == primitive.NilObjectID) {
				ch <- 0
				return
			}
			filter := bson.M{"_id": alert.PostID}
			var post Post
			err = PostColl.FindOne(context.Background(), filter).Decode(&post)
			if err != nil {
				ch <- -1
				return
			}
			results[idx].Postjson = post
			ch <- 0
		}(i, alert)
	}

	for range userAlerts.Alert {
		if <-ch == -1 {
			return c.JSON(http.StatusInternalServerError, "failed to get alert info")
		}
		if <-ch == -1 {
			return c.JSON(http.StatusInternalServerError, "failed to get alert info")
		}
	}

	
	return c.JSON(http.StatusOK, results)
}
