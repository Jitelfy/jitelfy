package web_api

import (
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

var SecretKey = []byte("cd9af1596c8eaa983b2ebc00b57d62c4e8e1292c399aa8c678e79b2832661713")

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
