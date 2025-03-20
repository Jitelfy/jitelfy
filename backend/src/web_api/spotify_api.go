package web_api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

// man wtf
func GetSinglePostBackend(id string) ([]Post, error) {
	var postFilter, commentFilter bson.D

	// conver obj id
	if objID, err := primitive.ObjectIDFromHex(id); err != nil {
		return []Post{}, err
	} else {
		// make db find filters
		postFilter = bson.D{{Key: "_id", Value: objID}}
		commentFilter = bson.D{{Key: "parentid", Value: objID}}
	}

	var mainPost Post
	var err error

	// channel len 1
	validParent := make(chan int, 1)

	// find the post given by the function parameter id
	go func() {
		err := PostColl.FindOne(context.TODO(), postFilter).Decode(&mainPost)
		if err != nil {
			validParent <- -1
			return
		}
		validParent <- 0
	}()
	// mongo cursor
	type PostResult struct {
		Data  []Post
		Error error
	}
	ch := make(chan PostResult)
	go func() {
		var cursor *mongo.Cursor
		cursor, err = PostColl.Find(context.TODO(), commentFilter)
		if err != nil {
			ch <- PostResult{nil, err}
			return
		}
		var commentResults []Post
		// store all in array
		err = cursor.All(context.TODO(), &commentResults)
		if err != nil {
			ch <- PostResult{nil, err}
			return
		}
		ch <- PostResult{commentResults, nil}
	}()
	res := <-ch
	if res.Error != nil {
		return []Post{}, res.Error
	}
	if <-validParent == -1 {
		return []Post{}, err
	}
	res.Data = append(res.Data, mainPost)
	return res.Data, nil
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
	    fmt.Println("New decoder failed")
		return nil, err
	}

	return result, nil
}

func addTracksToPlaylist(accessToken string, playlistID string, trackURIs []string) error {
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

func HandleCreatePlaylist(c echo.Context) error {
	userStringID, _ := UserIdFromCookie(c)
	userObjectID, err := primitive.ObjectIDFromHex(userStringID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	var result = UserColl.FindOne(context.TODO(), bson.D{{Key: "_id", Value: userObjectID}})
	var user User
	if err := result.Decode(&user); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	type ReqBody struct {
		PostID      string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Public      bool   `json:"public"`
	}

	var req ReqBody
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// create playlist
	playlist, err := createPlaylist(user.SpotifyToken, req.Name, req.Description, req.Public)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// add songs to it
	postTree, err := GetSinglePostBackend(req.PostID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	var songs []string
	for _, post := range postTree {
		if post.Song != "" {
			songs = append(songs, trackURLToURI(post.Song))
		}
	}
	err = addTracksToPlaylist(user.SpotifyToken, playlist["id"].(string), songs)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to add tracks to playlist")
	}

	// return final playlist
	return c.JSON(http.StatusOK, playlist)
}
