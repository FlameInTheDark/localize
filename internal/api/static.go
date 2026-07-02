package api

import (
	"embed"
	"io/fs"

	"github.com/gofiber/fiber/v3/middleware/static"
)

//go:embed dist
var dist embed.FS

// Pre-resolved sub-filesystem and index.html for fast serving.
var rootFS fs.FS

func init() {
	sub, err := fs.Sub(dist, "dist")
	if err != nil {
		panic("web: cannot sub embed FS: " + err.Error())
	}
	rootFS = sub
}

// Register wires the embedded bundle onto the given Fiber v3 app.
func (a *API) RegisterStatic() {
	a.app.Use("/", static.New("", static.Config{
		FS: rootFS,
	}))
}
