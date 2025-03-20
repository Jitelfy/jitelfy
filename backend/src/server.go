package main

import (
	"context"
	"fmt"
	"github.com/labstack/gommon/log"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2/clientcredentials"
	"server/web_api"

	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {

	// mongodb
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI("mongodb+srv://jitelfy:JitelfyForever33@jitelfycluster.hgw9u.mongodb.net/" +
		"?retryWrites=true&w=majority&appName=JitelfyCluster").SetServerAPIOptions(serverAPI)

	// spotify
	authConfig := &clientcredentials.Config{
		ClientID:     "7f5165967f284534862eeee3a57f49f6",
		ClientSecret: "702a0f6d19b54fbe875176cc48554e88",
		TokenURL:     spotifyauth.TokenURL,
	}
	accessToken, err := authConfig.Token(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	httpClient := spotifyauth.New().Client(context.Background(), accessToken)
	spotifyClient := spotify.New(httpClient)
	if spotifyClient == nil {
		log.Fatal("spotify client is nil")
	}

	// create a client, connect to server
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			fmt.Println(err)
			return
		}
		fmt.Println("disconnected from cluster")
	}()
	// Send a ping to confirm a successful connection
	var db = client.Database("jitelfy")
	if err := db.RunCommand(context.TODO(),
		bson.D{{Key: "ping", Value: 1}}).Err(); err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("Jitelfy successfully connected to Cluster Server.")

	web_api.AlertColl = db.Collection("alerts")
	web_api.PostColl = db.Collection("posts")
	web_api.UserColl = db.Collection("users")
	web_api.RepostColl = db.Collection("reposts")
	web_api.BookmarkColl = db.Collection("bookmarks")
	web_api.SOTDColl = db.Collection("sotd")

	router := echo.New()
	router.Debug = true
	router.GET("/posts/top", web_api.GetPosts)
	router.GET("/posts/comments", web_api.GetComments)
	router.POST("/posts/top", web_api.CreatePost)
	router.POST("/posts/comments", web_api.CreateComment)
	router.DELETE("/posts", web_api.DeletePost)
	router.POST("/posts/like/:id", web_api.LikePost)
	router.POST("/posts/unlike/:id", web_api.UnlikePost)
	router.POST("/posts/bookmark/:id", web_api.BookmarkPost)
	router.POST("/posts/unbookmark/:id", web_api.UnbookmarkPost)
	router.POST("/posts/repost/:id", web_api.MakeRepost)
	router.POST("/posts/unrepost/:id", web_api.DeleteRepost)
	router.GET("/users/reposts/:id", web_api.GetAllReposts)
	router.GET("/sotd", web_api.GetSongOfTheDay)

	router.GET("/spotify/sauth", web_api.SpotifyHandler)
	router.GET("/spotify/refresh", web_api.SpotifyRefreshHandler)
	router.GET("/spotify/callback", web_api.SpotifyCallbackHandler)
	router.POST("/spotify/tp", web_api.HandleCreatePlaylist)

	router.GET("/users/:id", web_api.GetUser)
	router.GET("/user/all", web_api.GetUsers)
	router.GET("/users/bookmarks", web_api.GetBookmarks)
	router.GET("/users/alerts", web_api.GetUserAlerts)
	router.GET("/posts/from", web_api.GetAllPostsFromUser)

	router.PUT("/customize/icon", web_api.SetIcon)
	router.PUT("/customize/banner", web_api.SetBanner)
	router.PUT("/customize/bio", web_api.SetBio)
	router.PUT("/customize/displayname", web_api.SetDisplayName)
	router.PUT("/customize/favsong", web_api.SetFavSong)

	router.POST("/signup", web_api.MakeUser)
	router.POST("/login", web_api.Login)
	router.POST("/users/follow/:id", web_api.FollowUser)
	router.POST("/users/unfollow/:id", web_api.UnfollowUser)
	router.POST("/logout", web_api.Logout)

	router.GET("/users/restore", web_api.RestoreUserFromCookie)
	router.GET("/sotd", web_api.GetSongOfTheDay)

	router.Use(middleware.RequestLoggerWithConfig(web_api.Log))
	router.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"http://localhost:*"}, // placeholder for local vite
		AllowHeaders:     []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, "Authorization"},
		AllowCredentials: true,
	}))
	router.Use(echojwt.WithConfig(echojwt.Config{
		SigningKey:  []byte(web_api.SecretKey),
		TokenLookup: "cookie:Authorization",
		Skipper: func(c echo.Context) bool {
			if c.Path() == "/signup" || c.Path() == "/login" {
				return true
			}
			if c.Request().Method == "GET" && c.Path() != "/users" {
				return true
			}
			return false
		},
	}))

	router.Logger.Debug(router.Start("localhost:8080"))
}
