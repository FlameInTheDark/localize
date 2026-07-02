package ollama

import (
	"context"
	"errors"

	"github.com/firebase/genkit/go/ai"
	"github.com/firebase/genkit/go/genkit"
	"github.com/firebase/genkit/go/plugins/ollama"
)

type OllamaConfig struct {
	Model   string
	Address string
}

type Ollama struct {
	gk     *genkit.Genkit
	config OllamaConfig
	model  ai.Model
}

func NewOllama(config OllamaConfig) *Ollama {
	if config.Address == "" {
		config.Address = "http://localhost:11434"
	}
	return &Ollama{
		config: config,
	}
}

func (provider *Ollama) Initialize() error {
	o := &ollama.Ollama{
		ServerAddress: provider.config.Address,
	}
	g := genkit.Init(context.Background(),
		genkit.WithPlugins(o),
		genkit.WithDefaultModel("ollama/"+provider.config.Model))
	o.DefineModel(g,
		ollama.ModelDefinition{
			Name: provider.config.Model,
			Type: "chat",
		},
		&ai.ModelOptions{
			Supports: &ai.ModelSupports{
				LongRunning: true,
				Multiturn:   true,
				SystemRole:  true,
				ToolChoice:  true,
				Tools:       true,
				Media:       true,
			},
		})
	provider.gk = g
	return nil
}

func (provider *Ollama) Query(ctx context.Context, query string, system string) (string, error) {
	resp, err := genkit.Generate(ctx, provider.gk,
		ai.WithSystem(system),
		ai.WithPrompt(query),
	)
	if err != nil {
		return "", err
	}
	if resp.Message == nil {
		return "", errors.New("no response")
	}
	return resp.Message.Text(), nil
}

func (provider *Ollama) QueryMedia(ctx context.Context, query string, system string, mediaFormat string, mediaData string) (string, error) {
	resp, err := genkit.Generate(ctx, provider.gk,
		ai.WithSystem(system),
		ai.WithMessages(
			ai.NewUserMessage(
				ai.NewMediaPart(mediaFormat, mediaData),
				ai.NewTextPart(query),
			),
		),
	)
	if err != nil {
		return "", err
	}
	if resp.Message == nil {
		return "", errors.New("no response")
	}
	return resp.Message.Text(), nil
}
