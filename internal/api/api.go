package api

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type ApiEntity interface {
	Name() string
	Register(router fiber.Router) error
}
type API struct {
	baseUrl string
	app     *fiber.App
}

func NewAPI(baseUrl string) *API {
	app := fiber.New(fiber.Config{})
	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"*"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
	}))
	return &API{
		baseUrl: baseUrl,
		app:     app,
	}
}

func (a *API) Register(entities ...ApiEntity) error {
	g := a.app.Group("/api/v1")
	for _, e := range entities {
		err := e.Register(g.Group(e.Name()))
		if err != nil {
			return err
		}
	}
	a.RegisterStatic()
	return nil
}

func (a *API) Run() error {
	a.app.Hooks().OnListen(func(data fiber.ListenData) error {
		slog.Info("Starting app", slog.String("address", data.Host+":"+data.Port))
		return nil
	})
	return a.app.Listen(a.baseUrl, fiber.ListenConfig{
		DisableStartupMessage: true,
	})
}

func (a *API) Stop() error {
	return a.app.ShutdownWithTimeout(time.Second * 20)
}
