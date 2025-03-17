package web_api

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const (
	clientID     = "7f5165967f284534862eeee3a57f49f6"
	clientSecret = "702a0f6d19b54fbe875176cc48554e88"
	redirectURI  = "http://localhost:8080/spotify/callback"
	authURL      = "https://accounts.spotify.com/authorize"
	tokenURL     = "https://accounts.spotify.com/api/token"
)

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

func SpotifyHandler(c echo.Context) error {
	scope := "user-read-private user-read-email playlist-modify-private user-read-playback-position user-top-read user-read-recently-played"
	authEndpoint := fmt.Sprintf(
		"%s?client_id=%s&response_type=code&redirect_uri=%s&scope=%s&state=xyz123",

		authURL,
		clientID,
		url.QueryEscape(redirectURI),
		url.QueryEscape(scope))
	return c.Redirect(http.StatusTemporaryRedirect, authEndpoint)
}

func SpotifyCallbackHandler(c echo.Context) error {
	userStringID, _ := UserIdFromCookie(c)
	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}
	code := c.QueryParam("code")
	if code == "" {
		return c.String(http.StatusBadRequest, "No code provided")
	}

	// token exchange req
	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	// response
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	// ngl the ide told me to wrap this
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	// parse response and set cookies
	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	_, err = UserColl.UpdateOne(context.TODO(), bson.M{"userid": userObjectID}, bson.M{"$set": bson.M{"SpotifyToken": tokenResp.AccessToken}})
	_, err = UserColl.UpdateOne(context.TODO(), bson.M{"userid": userObjectID}, bson.M{"$set": bson.M{"SpotifyRefresh": tokenResp.RefreshToken}})

	// also returning this
	return c.JSON(http.StatusOK, tokenResp)
}
