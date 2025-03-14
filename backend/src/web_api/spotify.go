package web_api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	clientID     = "7f5165967f284534862eeee3a57f49f6"
	clientSecret = "702a0f6d19b54fbe875176cc48554e88"
	redirectURI  = "http://localhost:8080/callback"
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
	spotifyTokenCookie := &http.Cookie{
		Name:     "spotify_access_token",
		Value:    tokenResp.AccessToken,
		Expires:  time.Now().Add(time.Hour * 72),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}
	c.SetCookie(spotifyTokenCookie)
	spotifyRefreshCookie := &http.Cookie{
		Name:     "spotify_refresh_token",
		Value:    tokenResp.RefreshToken,
		Expires:  time.Now().Add(time.Hour * 72),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}
	c.SetCookie(spotifyRefreshCookie)
	// also returning this
	return c.JSON(http.StatusOK, tokenResp)
}

func RefreshSpotifyToken(c echo.Context) error {
	// grab token from cookie
	refreshTokenCookie, err := c.Cookie("spotify_refresh_token")
	if err != nil || refreshTokenCookie == nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	refreshToken := refreshTokenCookie.Value

	// prep the request
	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)

	req, err := http.NewRequest("POST", tokenURL, bytes.NewBufferString(data.Encode()))
	if err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(clientID, clientSecret)

	// send the request, receive the response
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

	// parse response
	var tokenResp TokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return c.String(http.StatusInternalServerError, err.Error())
	}

	// reset the cookies
	spotifyTokenCookie := &http.Cookie{
		Name:     "spotify_access_token",
		Value:    tokenResp.AccessToken,
		Expires:  time.Now().Add(time.Hour * 72),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}
	c.SetCookie(spotifyTokenCookie)
	// idk if we need to reset the refresh cookie but why not man
	spotifyRefreshCookie := &http.Cookie{
		Name:     "spotify_refresh_token",
		Value:    tokenResp.RefreshToken,
		Expires:  time.Now().Add(time.Hour * 72),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	}
	c.SetCookie(spotifyRefreshCookie)
	// also returning this
	return c.JSON(http.StatusOK, tokenResp)
}
