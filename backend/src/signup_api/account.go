package signup_api

import (
	"context"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"net/http"
)

var AccColl *mongo.Collection

type Account struct {
	User     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Token    string             `json:"token" bson:"token"`
	Password string             `json:"password" bson:"password"`
}

func MakeAccount(c echo.Context) error {
	account := Account{}
	if err := c.Bind(&account); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid request")
	}
	if account.User.IsZero() {
		return c.JSON(http.StatusBadRequest, "invalid request")
	}
	if account.Password == "" {
		return c.JSON(http.StatusBadRequest, "invalid request")
	}

	encryptedPass, err := HashPassword(account.Password)
	if err != nil {
		return c.JSON(http.StatusBadRequest, "password hashing failed")
	}

	account = Account{
		User:     account.User,
		Token:    account.Token,
		Password: encryptedPass,
	}

	var bsonAcc, err2 = bson.Marshal(account)
	if err2 != nil {
		return c.JSON(http.StatusInternalServerError, "bson marshaling error")
	}
	_, err = AccColl.InsertOne(context.Background(), bsonAcc)
	return c.JSON(http.StatusCreated, account)
}

func LoginAccount(c echo.Context) error {
	account := Account{}
	if err := c.Bind(&account); err != nil {
		return c.JSON(http.StatusBadRequest, "invalid request")
	}

	token := jwt.New(jwt.SigningMethodHS256)
}
