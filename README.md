<div align="center">

<br/>

**Single-binary AI translation platform written in Go.**

Text translation | Document translation | Image text translation | OCR extraction

</div>

---

## ![](docs/assets/icons/layout-dashboard.svg) Architecture

Localize packages the backend API, embedded React UI, `mutool` integration for document extraction, OCR pipeline, and AI provider connections into one deployable binary. You upload documents or images, the backend extracts text and translates it using configured LLMs, and you get the translated output—all without splitting the stack across multiple services.

| Component | Path | Responsibility |
| :-- | :-- | :-- |
| Server entrypoint | `cmd/localize` | Starts the web server |
| API and embedded frontend | `internal/api` | API routes, file uploads, embedded web assets (`dist`), Swagger docs |
| Translation engine | `internal/translation` | Document parsing, text chunking, AI translation orchestration |
| OCR processing | `internal/ocr` | Image text extraction, layout analysis |
| Tooling | `mutool` (external) | PDF, DOCX, and document page extraction (bundled in Docker) |

---

## ![](docs/assets/icons/zap.svg) Features

- AI-powered text translation
- Document translation supporting PDF, DOCX, and other formats via `mutool`
- Image text translation with built-in OCR capabilities
- React frontend embedded directly into the Go binary for easy deployment
- Automatic language detection
- Auto-generated OpenAPI/Swagger documentation
- Single binary deployment with no external database dependencies

---

## ![](docs/assets/icons/layers.svg) Stack

| Area | Technology                                                                       |
| :-- |:---------------------------------------------------------------------------------|
| Language | Go `1.26`                                                                        |
| Backend | Go standard library / Fiber (depending on your setup)                            |
| Frontend | React + Vite (built with Bun, embedded into the server binary)                   |
| Document Processing | `mutool` (mupdf-tools)                                                           |
| AI integrations | Ollama, (OpenAI, Anthropic, Openrouter, OpenAI-compatible endpoints are planned) |
| API Docs | Swaggo (Swagger v2)                                                              |

---

## ![](docs/assets/icons/rocket.svg) Getting Started

### Prerequisites

- Go `1.26` or newer
- `bun` (for frontend builds)
- `make`
- `mutool` installed on your system (for document translation features)

### Quick start

Set your Ollama instance URL as an environment variable:

```bash
export OLLAMA_HOST="http://localhost:11434"
```

Then start Localize:

```bash
make run
```

Open [http://localhost:8080](http://localhost:8080).

---

## ![](docs/assets/icons/terminal.svg) Running

Run the app directly using Go:

```bash
make run
```

Or build the binary into the `bin/` directory and run it:

```bash
make build
./bin/localize.exe
```

---

## ![](docs/assets/icons/server.svg) Docker

Build the Docker image using the provided Makefile target:

```bash
make build-docker
```

Or build and run manually:

```bash
docker build -t localize:latest .
docker run -p 8080:8080 -e OLLAMA_HOST="http://localhost:11434" localize:latest
```

The Docker image is based on Alpine Linux and comes with `mutool` (via `mupdf-tools`) pre-installed. The app automatically detects `mutool` either in the system `PATH` or in the same directory as the executable.

Published images are expected at:

```text
ghcr.io/FlameInTheDark/localize:<tag>
ghcr.io/FlameInTheDark/localize:latest
```

---

## ![](docs/assets/icons/layers.svg) Configuration

Localize reads configuration from environment variables.

| Variable | Default | Description |
| :-- | :-- | :-- |
| `ADDRESS` | `:8080` | HTTP server address and port |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama LLM backend host URL |
| `MUMTOOL_PATH` | `mutool` | Path to the `mutool` executable |
| `TRANSLATION_MODEL` | `translategemma:latest` | Name of the model used for translation |
| `OCR_MODEL` | `glm-ocr:latest` | Name of the model used for OCR |

Notes:

- For local development without Docker, you must install `mutool` manually (e.g., `apt install mupdf-tools` or `brew install mupdf-tools`).

---

## ![](docs/assets/icons/activity.svg) Translation Capabilities

### Text Translation
- Direct text input with automatic source language detection
- Configurable target language and translation tone
- Context-aware translation using advanced LLMs

### Document Translation
- Upload PDF, DOCX, and text files
- `mutool` extracts text while preserving structure where possible
- Document reassembly and downloadable translated output

### Image and OCR
- Upload images (PNG, JPG) containing text
- OCR engine extracts text from images
- Extracted text is passed directly to the translation pipeline

---

## ![](docs/assets/icons/terminal.svg) Development

Before building the Go binary, ensure the frontend is built so it can be embedded via `go:embed`:

```bash
cd web
bun install
bun run build
cd ..
```

Useful Make targets:

| Target | What it does |
| :-- | :-- |
| `make build` | Build the Go server binary into `bin/localize.exe` |
| `make run` | Run the server directly using `go run ./cmd/localize` |
| `make build-docker` | Build the Docker image tagged as `localize:latest` |
| `make clean` | Remove the `bin` build directory |
| `make tools` | Install the `swag` CLI tool for Swagger generation |
| `make swag` | Format and generate OpenAPI/Swagger docs into `./docs/api` from `cmd/localize/main.go` |
| `make lint` | Run `golangci-lint run` with a 5-minute timeout |

---

## ![](docs/assets/icons/layout-dashboard.svg) Repository Layout

```text
cmd/localize      server entrypoint
internal/api      API routes, handlers, embedded frontend assets (dist)
internal/ocr      image OCR processing logic
internal/translation  text/document translation orchestration
internal/llm       LLM provider clients and integrations
bin/              compiled binary output directory
docs/api/         auto-generated Swagger JSON files
assets/           README and UI illustration assets
web/              React + Vite frontend (built with Bun)
```

---

<div align="center">

MIT License

</div>