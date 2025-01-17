package main

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var id int = 2

type Post struct {
	Id       int    `json:"id"`
	UserId   int    `json:"userid"`
	ParentId int    `json:"parentid"`
	ChildIds []int  `json:"childids"`
	LikeIds  []int  `json:"likeids"`
	Time     string `json:"time"`
	Text     string `json:"text"`
	Embed    string `json:"embed"`
	Song     string `json:"song"`
}

var postdb map[int]Post

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
	postdb = make(map[int]Post)
	postdb[1] = Post{
		Id:    1,
		Time:  time.Now().Format(time.RFC3339),
		Text:  "Test post",
		Embed: "URL",
		Song:  "Song",
	}

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
		return c.JSON(http.StatusBadRequest, "invalid json")
	}

	post = Post{
		Id:       id,
		ParentId: post.ParentId,
		ChildIds: post.ChildIds,
		Time:     time.Now().Format(time.RFC3339),
		Text:     post.Text,
		Embed:    post.Embed,
		Song:     post.Song,
	}
	id = id + 1

	// maybe replace with post request with a parent id parameter
	if post.ParentId != 0 {
		parent, ok := postdb[post.ParentId]
		if ok {
			parent.ChildIds = append(parent.ChildIds, post.Id)
			postdb[parent.Id] = parent
		} else {
			return c.JSON(http.StatusBadRequest, "parent does not exist")
		}

	}
	postdb[post.Id] = post
	return c.JSON(http.StatusOK, postdb)
}
