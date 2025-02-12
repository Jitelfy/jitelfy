package signup_api

import (
	"github.com/labstack/echo/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"net/http"
)

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

	return c.JSON(http.StatusCreated, account)
}
