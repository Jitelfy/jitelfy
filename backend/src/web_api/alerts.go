package web_api

import (
	"github.com/labstack/echo/v4"
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

func InitAlerts(c echo.Context) error {
	var err error

	if err = c.Bind(&UserAlerts{}); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

}
