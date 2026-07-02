# Makefile for the Localize translation frontend (Vite + React).
#
# Produces a STATIC bundle (via `vite build`) in ./dist that can be embedded
# directly into a Go binary with `embed.FS`:
#
#	//go:embed dist
#	var assets embed.FS
#
# Two build variants are supported. They are identical except for the backend
# API address inlined at build time (see src/lib/api.ts):
#
#   make build-origin   API calls go to /api/v1/* on the SAME origin the app
#                       is served from. Embed this bundle inside your Go
#                       backend — the backend serves both the static files and
#                       the /api/v1/* routes, so everything is same-origin.
#
#   make build-custom   API calls go to $(API_BASE)/api/v1/*. Use this when the
#                       frontend is hosted separately from the API, or for local
#                       dev against your own backend address.
#
# Output structure (clean — no `_next` folder):
#   dist/
#     index.html
#     assets/            ← JS/CSS/fonts, content-hashed filenames
#     logo.svg
#     ...
#
# Examples:
#   make build-origin                          # embed in Go (same-origin API)
#   make build-custom                          # API -> http://localhost:8080
#   make build-custom API_BASE=https://api.example.com
#   make dev                                   # Vite dev server -> $(API_BASE)
#   make dev API_BASE=http://192.168.1.5:8080

# Backend address used by `make dev` and `make build-custom`.
# Override on the command line: make build-custom API_BASE=https://api.example.com
API_BASE ?= http://localhost:8080

# Output directory produced by `vite build`.
OUT_DIR ?= dist

.PHONY: dev build-origin build-custom clean lint help

# Run the Vite dev server on :3000, with the browser talking directly to
# $(API_BASE). Note: for cross-origin dev (frontend on :3000, API on :8080) your
# Go backend must allow CORS from the dev origin. In production (build-origin,
# same-origin) no CORS is needed.
dev:
	VITE_API_BASE_URL=$(API_BASE) bun run dev

# Static bundle → ./dist. API on the SAME origin (embed this in your Go backend).
build-origin:
	VITE_API_BASE_URL= bun run build

# Static bundle → ./dist. API at $(API_BASE) (dev or separate hosting).
build-custom:
	VITE_API_BASE_URL=$(API_BASE) bun run build

# Remove build artifacts.
clean:
	rm -rf $(OUT_DIR) .next out

lint:
	bun run lint

help:
	@echo "Localize frontend — targets:"
	@echo ""
	@echo "  make dev              Vite dev server on :3000 (API -> $(API_BASE))"
	@echo "  make build-origin     Static bundle in ./dist, API on same origin (embed in Go)"
	@echo "  make build-custom     Static bundle in ./dist, API -> \$$API_BASE (default: $(API_BASE))"
	@echo "  make clean            Remove ./dist, ./.next, ./out"
	@echo "  make lint             Run ESLint"
	@echo ""
	@echo "Override the backend address with API_BASE=..., e.g.:"
	@echo "  make build-custom API_BASE=https://api.example.com"
