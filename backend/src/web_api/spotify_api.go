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

func GetSinglePostBackend(id string) (CompleteSinglePost, error) {
	var post_filter, comment_filter bson.D

	if objID, err := primitive.ObjectIDFromHex(id); err != nil {
		return CompleteSinglePost{}, err
	} else {
		post_filter = bson.D{{Key: "_id", Value: objID}}
		comment_filter = bson.D{{Key: "parentid", Value: objID}}
	}

	var main_post PostUserPackage
	var err error

	valid_parent := make(chan int, 1)

	go func() {
		err := PostColl.FindOne(context.TODO(), post_filter).Decode(&main_post.Postjson)
		if err != nil {
			valid_parent <- -1
			return
		}
		user_filter := bson.D{{Key: "_id", Value: main_post.Postjson.UserId}}

		err = UserColl.FindOne(context.TODO(), user_filter).Decode(&main_post.Userjson)
		if err != nil {
			valid_parent <- -1
			return
		}

		valid_parent <- 0
	}()

	var cursor *mongo.Cursor
	cursor, err = PostColl.Find(context.TODO(), comment_filter)
	if err != nil {
		return CompleteSinglePost{}, err
	}
	var comment_results []Post
	err = cursor.All(context.TODO(), &comment_results)
	if err != nil {
		return CompleteSinglePost{}, err
	}

	var packagedresults = make([]PostUserPackage, len(comment_results))

	var ch = make(chan *PostUserPackage, len(comment_results))

	for _, currpost := range comment_results {
		go func(post Post) {
			var userfilter = bson.D{{Key: "_id", Value: post.UserId}}
			var result = UserColl.FindOne(context.TODO(), userfilter)
			var user BaseUser
			if user_err := result.Decode(&user); user_err != nil {
				ch <- nil
			}
			ch <- &PostUserPackage{
				Postjson: post,
				Userjson: user,
			}
		}(currpost)
	}

	if <-valid_parent == -1 {
		return CompleteSinglePost{}, err
	}

	for idx := range comment_results {
		var packagedpost = <-ch
		// for now just ignore invalid comments
		if packagedpost != nil {
			packagedresults[idx] = *packagedpost
		}
	}

	result := CompleteSinglePost{
		Post:     main_post,
		Comments: packagedresults,
	}

	return result, nil
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
		return echo.NewHTTPError(http.StatusBadRequest, "failed to create playlist")
	}

	// add songs to it
	post, err := GetSinglePostBackend(req.PostID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get post")
	}
	var songs []string
	songs = append(songs, trackURLToURI(post.Post.Postjson.Song))
	for _, comment := range post.Comments {
		songs = append(songs, trackURLToURI(comment.Postjson.Song))
	}

	return c.JSON(http.StatusOK, playlist)
}
