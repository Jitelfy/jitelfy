package main

import (
	"net/http"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type test struct {
	Id       string `json:"id" bson:"id"`
	Username string `json:"username" bson:"username"`
}

var testdb = []test{
	{Id: "0", Username: "alexei"},
	{Id: "1", Username: "k z 3"},
}

func main() {
	router := echo.New()
	router.Debug = true
	router.Use(middleware.Logger())
	router.GET("/testdb", getTest)

	router.Logger.Debug(router.Start("localhost:8080"))


}

func getTest(c echo.Context) error {
	return c.JSONPretty(http.StatusOK, testdb, "    ")
}

