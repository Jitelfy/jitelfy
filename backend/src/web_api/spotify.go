package web_api

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"io"
	"os"
	"net/http"
	"net/url"
	"strings"
)

const (
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
	clientID := os.Getenv("SPOTIFY_ID")
	scope := "user-read-private user-read-email playlist-modify-private playlist-modify-public playlist-read-private user-read-playback-position user-top-read user-read-recently-played"
	userStringID, err := UserIdFromCookie(c)
	if err != nil {
		return c.String(http.StatusUnauthorized, "cookie fail")
	}
	state := userStringID
	authEndpoint := fmt.Sprintf(
		"%s?client_id=%s&response_type=code&redirect_uri=%s&scope=%s&state=%s",
		authURL,
		clientID,
		url.QueryEscape(redirectURI),
		url.QueryEscape(scope),
		url.QueryEscape(state))
	return c.Redirect(http.StatusTemporaryRedirect, authEndpoint)
}

func SpotifyCallbackHandler(c echo.Context) error {
	clientID := os.Getenv("SPOTIFY_ID")
	clientSecret := os.Getenv("SPOTIFY_SECRET")
	state := c.QueryParam("state")
	userObjectID, err := primitive.ObjectIDFromHex(state)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "cookie fail callback")
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
	_, err = UserColl.UpdateOne(context.TODO(), bson.M{"_id": userObjectID}, bson.M{"$set": bson.M{"spotify_token": tokenResp.AccessToken}})
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	_, err = UserColl.UpdateOne(context.TODO(), bson.M{"_id": userObjectID}, bson.M{"$set": bson.M{"spotify_refresh": tokenResp.RefreshToken}})
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	// also returning this
	return c.Redirect(http.StatusPermanentRedirect, "http://localhost:5173/settings")
}

func SpotifyRefreshHandler(c echo.Context) error {
	clientID := os.Getenv("SPOTIFY_ID")
	clientSecret := os.Getenv("SPOTIFY_SECRET")
	userStringID, err := UserIdFromCookie(c)
	if err != nil {
		return c.String(http.StatusUnauthorized, "cookie fail")
	}

	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return c.String(http.StatusBadRequest, "invalid user id")
	}

	var user User
	err = UserColl.FindOne(context.TODO(), bson.M{"_id": userObjectID}).Decode(&user)
	if err != nil {
		return c.String(http.StatusInternalServerError, "could not find user")
	}

	if user.SpotifyRefresh == "" {
		return c.String(http.StatusBadRequest, "no refresh token stored")
	}

	// build token refresh request
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", user.SpotifyRefresh)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	_, err = UserColl.UpdateOne(context.TODO(), bson.M{"_id": userObjectID}, bson.M{"$set": bson.M{"spotify_token": tokenResp.AccessToken}})
	if err != nil {
		return c.String(http.StatusInternalServerError, "failed to update token in DB")
	}
	if tokenResp.RefreshToken != "" {
		_, err = UserColl.UpdateOne(context.TODO(), bson.M{"_id": userObjectID}, bson.M{"$set": bson.M{"spotify_refresh": tokenResp.RefreshToken}})
		if err != nil {
			return c.String(http.StatusInternalServerError, "failed to update token in DB")
		}
	}

	return c.JSON(http.StatusOK, tokenResp)
}
