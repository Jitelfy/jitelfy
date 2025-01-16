package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var id int = 1

type Post struct {
	Id    int    `json:"id"`
	Text  string `json:"text"`
	Embed string `'json:"embed"`
	Song  string `json:"song"`
}
type test struct {
	Id       string `json:"id" bson:"id"`
	Username string `json:"username" bson:"username"`
}

var postdb = []Post{
	{Id: 0, Text: "Test post", Embed: "URL", Song: "Song"},
}

const (
	colorReset = "\033[0m"
	colorRed   = "\033[31m"
	colorGreen = "\033[32m"
)

func main() {
	router := echo.New()
	router.Debug = true
	router.GET("/postdb", getPost)
	router.POST("/postdb", createPost)

	var logger = middleware.RequestLoggerConfig{
		LogStatus:     true,
		LogURI:        true,
		LogRemoteIP:   true,
		LogMethod:     true,
		LogLatency:    true,
		LogValuesFunc: logger,
	}

	router.Use(middleware.RequestLoggerWithConfig(logger))

	router.Logger.Debug(router.Start("localhost:8080"))
}

func getPost(c echo.Context) error {
	return c.JSON(http.StatusOK, postdb)
}

func logger(c echo.Context, v middleware.RequestLoggerValues) error {
	fmt.Printf("%v | %v | %v %v | ", v.StartTime.Format("2006-01-02 15:04:05"), v.RemoteIP, v.Method, v.URI)
	color := colorGreen
	if v.Status != 200 {
		color = colorRed
	}
	fmt.Printf("%v%v%v | %v\n", color, v.Status, colorReset, v.Latency)
	return nil
}

func createPost(c echo.Context) error {
	post := Post{}
	// error checking for valid json
	if err := c.Bind(&post); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	post = Post{
		Id:    id,
		Text:  post.Text,
		Embed: post.Embed,
		Song:  post.Song,
	}
	id = id + 1

	postdb = append(postdb, post)
	return c.JSON(http.StatusOK, postdb)
}
