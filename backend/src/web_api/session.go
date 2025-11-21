package web_api

import (
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
	"os"
)

var SecretKey = []byte(os.Getenv("JWT_SECRET"))

func createToken(username string, id primitive.ObjectID) (string, error) {
	claims := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"id":       id,
		"issuer":   "jitelfy",
		"exp":      time.Now().Add(time.Hour * 12).Unix(),
		"iat":      time.Now().Unix(),
	})
	token, err := claims.SignedString(SecretKey)
	if err != nil {
		return "signing error", err
	}
	return token, nil
}
