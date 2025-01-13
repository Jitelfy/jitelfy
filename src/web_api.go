package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
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
	router := gin.Default()
	router.GET("/testdb", getTest)
	router.POST("/testdb", postTest)

	router.Run("localhost:8080")

}

func getTest(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, testdb)
}

func postTest(c *gin.Context) {
	var newUser test

	if err := c.BindJSON(&newUser); err != nil {
		return
	}
	testdb = append(testdb, newUser)
	c.IndentedJSON(http.StatusOK, newUser)
}
