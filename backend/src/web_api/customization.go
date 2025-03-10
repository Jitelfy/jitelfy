package web_api

import (
	"context"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

func SetIcon(c echo.Context) error {

	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	req := struct {
		Icon int `json:"icon"`
	}{}

	if req.Icon < 0 || req.Icon > 15 {
		return c.JSON(http.StatusBadRequest, "icon must be between 0 and 15")
	}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "$set", Value: bson.D{{Key: "icon", Value: req.Icon}}}}
	var result *mongo.UpdateResult
	result, err = UserColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update icon")
	}

	return c.JSON(http.StatusOK, result)

}

func SetBanner(c echo.Context) error {

	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	req := struct {
		Banner int `json:"banner"`
	}{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "$set", Value: bson.D{{Key: "banner", Value: req.Banner}}}}
	var result *mongo.UpdateResult
	result, err = UserColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update banner")
	}

	return c.JSON(http.StatusOK, result)
}

func SetBio(c echo.Context) error {
	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	req := struct {
		Bio string `json:"bio"`
	}{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "$set", Value: bson.D{{Key: "bio", Value: req.Bio}}}}
	var result *mongo.UpdateResult
	result, err = UserColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update bio")
	}

	return c.JSON(http.StatusOK, result)
}

func SetDisplayName(c echo.Context) error {
	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	req := struct {
		Displayname string `json:"displayname"`
	}{}

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "$set", Value: bson.D{{Key: "displayname", Value: req.Displayname}}}}
	var result *mongo.UpdateResult
	result, err = UserColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update display name")
	}

	return c.JSON(http.StatusOK, result)
}

func SetFavSong(c echo.Context) error {
	var userid primitive.ObjectID
	var idString, err = UserIdFromCookie(c)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to get userid from cookie")
	}

	req := struct {
		Song string `json:"song"`
	}{}

	if !strings.Contains(req.Song, "https://open.spotify.com/track/") {
		return c.JSON(http.StatusBadRequest, "invalid song link")
	}
	song := strings.Replace(req.Song, "/track/", "/embed/track/", 1)

	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	userid, err = primitive.ObjectIDFromHex(idString)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "failed to parse userid from cookie")
	}

	filter := bson.D{{Key: "_id", Value: userid}}
	change := bson.D{{Key: "$set", Value: bson.D{{Key: "song", Value: song}}}}
	var result *mongo.UpdateResult
	result, err = UserColl.UpdateOne(context.TODO(), filter, change)
	if err != nil || result.MatchedCount == 0 {
		return c.JSON(http.StatusInternalServerError, "failed to update favorite song")
	}

	return c.JSON(http.StatusOK, result)
}
