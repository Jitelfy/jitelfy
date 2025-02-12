package web_api

import "github.com/golang-jwt/jwt/v5"

var secretKey = []byte("secret_key")

func createToken(username string) (string, error) {
	claims := jwt.MapClaims{}
}
