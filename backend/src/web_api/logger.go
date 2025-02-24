package web_api

import (
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

var Log = middleware.RequestLoggerConfig{
	LogStatus:     true,
	LogURI:        true,
	LogRemoteIP:   true,
	LogMethod:     true,
	LogLatency:    true,
	LogValuesFunc: Logger,
}

const (
	colorReset = "\033[0m"
	colorRed   = "\033[31m"
	colorGreen = "\033[32m"
)

func Logger(c echo.Context, v middleware.RequestLoggerValues) error {
	fmt.Printf("%v | %v | %v %v | ", v.StartTime.Format("2006-01-02 15:04:05"), v.RemoteIP, v.Method, v.URI)
	color := colorGreen
	if v.Status > 299 || v.Status < 200 {
		color = colorRed
	}
	fmt.Printf("%v%v%v | %v\n", color, v.Status, colorReset, v.Latency)
	return nil
}
