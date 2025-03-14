package web_api

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"net/http"
	"net/url"
)

const (
	clientID     = "7f5165967f284534862eeee3a57f49f6"
	clientSecret = "702a0f6d19b54fbe875176cc48554e88"
	redirectURI  = "http://localhost:8080/callback"
	authURL      = "https://accounts.spotify.com/authorize"
	tokenURL     = "https://accounts.spotify.com/api/token"
)

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
	return nil
}
