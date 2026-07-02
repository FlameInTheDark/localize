# syntax=docker/dockerfile:1

# ----------------------------------------------------------------------------
# Stage 1: Builder — compiles the React frontend with Bun and the Go binary
# ----------------------------------------------------------------------------
FROM golang:1.26-bookworm AS builder

# Install dependencies needed to install Bun
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy frontend dependency manifests first to leverage Docker layer caching
# Using a wildcard for bun.lockb so it doesn't fail if you haven't created it yet
COPY web/package.json web/bun.lockb* ./web/

# Install frontend deps using Bun
RUN cd web && bun install

# Copy the rest of the frontend source
COPY web/ ./web/

# Build the frontend using your specific command (output: ./web/dist)
RUN cd web && VITE_API_BASE_URL= bun run build

# Copy the rest of the Go application source
COPY . .

# Move the built frontend bundle into ./internal/api/dist so go:embed
# picks it up and bakes it into the binary.
RUN cp -r ./web/dist ./internal/api/dist

# Build a static, stripped Go binary (works on Alpine / scratch images)
RUN CGO_ENABLED=0 GOOS=linux \
    go build -trimpath -ldflags="-s -w" \
    -o /out/localize ./cmd/localize

# ----------------------------------------------------------------------------
# Stage 2: Runtime — minimal image that ships mutool alongside the binary
# ----------------------------------------------------------------------------
FROM alpine:3.19 AS runtime

# mutool is shipped by the `mupdf-tools` package on Alpine.
# ca-certificates: for outbound HTTPS (translation APIs, etc.)
# tzdata: timezone data (often useful for i18n apps)
RUN apk add --no-cache mupdf-tools ca-certificates tzdata \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy the compiled binary
COPY --from=builder /out/localize /app/localize

# Make mutool discoverable BOTH via PATH (already is, in /usr/bin) AND
# from the executable directory (/app), since the Go app may look it up
# next to its own binary via filepath.Dir(os.Executable()).
RUN ln -s "$(command -v mutool)" /app/mutool \
    && chown -R app:app /app

USER app

ENTRYPOINT ["/app/localize"]