package main

import (
	"fmt"
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
	{Id: "2", Username: "fuck you abdullah"},
}

const (
	colorReset = "\033[0m"
	colorRed = "\033[31m"
	colorGreen = "\033[32m"
)

func main() {
	router := echo.New()
	router.Debug = true
	router.GET("/testdb", getTest)

	var logger = middleware.RequestLoggerConfig{
		LogStatus: true,
		LogURI: true,
		LogRemoteIP: true,
		LogMethod: true,
		LogLatency: true,
		LogValuesFunc: logger,
	}

	router.Use(middleware.RequestLoggerWithConfig(logger))

	router.Logger.Debug(router.Start("localhost:8080"))
}

func getTest(c echo.Context) error {
	return c.JSON(http.StatusOK, testdb)
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

