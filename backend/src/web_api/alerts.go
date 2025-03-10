package web_api

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var AlertColl *mongo.Collection

type Alert struct {
	Id     primitive.ObjectID   `json:"id" bson:"_id"`
	UserId primitive.ObjectID   `json:"userid" bson:"userid"`
	Alerts []primitive.ObjectID `json:"alerts" bson:"alerts"`
}
