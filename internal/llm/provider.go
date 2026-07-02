package llm

import "context"

type Provider interface {
	Initialize() error
	Query(ctx context.Context, query string, system string) (string, error)
	QueryMedia(ctx context.Context, query string, system string, mediaFormat string, mediaData string) (string, error)
}
