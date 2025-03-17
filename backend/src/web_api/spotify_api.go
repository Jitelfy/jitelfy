package web_api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"io"
	"net/http"
	"strings"
)

func trackURLToURI(url string) string {
	parts := strings.Split(url, "/track/")
	if len(parts) < 2 {
		return ""
	}
	id := strings.Split(parts[1], "?")[0]
	return "spotify:track:" + id
}

func createPlaylist(accessToken string, playlistName string, playlistDescription string, isPublic bool) (map[string]interface{}, error) {
	body := map[string]interface{}{
		"name":        playlistName,
		"description": playlistDescription,
		"public":      isPublic,
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://api.spotify.com/v1/me/playlists", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			return
		}
	}(resp.Body)

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func addTracksToPlaylist(accessToken, playlistID string, trackURIs []string) error {
	body := map[string]interface{}{
		"uris": trackURIs,
	}

	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("https://api.spotify.com/v1/playlists/%s/tracks", playlistID)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {

		}
	}(resp.Body)

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to add tracks: %s", body)
	}
	return nil
}

func handleCreatePlaylist(c echo.Context) error {
	accessTokenCookie, err := c.Cookie("spotify_access_token")
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "bad cookie")
	}

	type ReqBody struct {
		PostID      string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Public      bool   `json:"public"`
	}

	var req ReqBody
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to parse body")
	}

	// create playlist
	playlist, err := createPlaylist(accessTokenCookie.Value, req.Name, req.Description, req.Public)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "Failed to create playlist"})
	}

	// add songs to it
	var result = PostColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: req.PostID}})
	var post Post
	if err := result.Decode(&post); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to decode post")
	}
	var songs []string
	songs = append(songs, post.Song)

	return c.JSON(http.StatusOK, playlist)
}
