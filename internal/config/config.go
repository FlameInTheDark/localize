package config

import (
	_ "embed"
	"fmt"
	"log/slog"

	"github.com/ilyakaznacheev/cleanenv"
)

//go:embed TranslatePrompt.tmpl
var templateText string

//go:embed DetectPrompt.tmpl
var detectText string

//go:embed OCRPrompt.tmpl
var ocrText string

type Config struct {
	Address    string    `yaml:"address" env:"ADDRESS" env-default:":8080"`
	OllamaHost string    `yaml:"ollama-host" env:"OLLAMA_HOST" env-default:"http://localhost:11434"`
	Models     Models    `yaml:"models"`
	Prompts    Templates `yaml:"prompts"`
	MuToolPath string    `yaml:"mumtool-path" env:"MUMTOOL_PATH" env-default:"mutool"`
}

type Templates struct {
	TranslatePrompt string `yaml:"translate-prompt"`
	DetectPrompt    string `yaml:"detect-prompt"`
	OCRPrompt       string `yaml:"ocr-prompt"`
}
type Models struct {
	Translation struct {
		Name string `yaml:"name" env:"TRANSLATION_MODEL" env-default:"translategemma:latest"`
	} `yaml:"translation"`

	OCR struct {
		Name string `yaml:"name" env:"OCR_MODEL" env-default:"glm-ocr:latest"`
	} `yaml:"ocr"`
}

func LoadConfig(filePath string) (*Config, error) {
	var config Config
	err := cleanenv.ReadConfig(filePath, &config)
	if err != nil {
		slog.Warn("Unable to read config from file", slog.String("error", err.Error()))
		err = cleanenv.ReadEnv(&config)
		if err != nil {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
	}

	if config.Prompts.TranslatePrompt == "" {
		config.Prompts.TranslatePrompt = templateText
	}
	if config.Prompts.DetectPrompt == "" {
		config.Prompts.DetectPrompt = detectText
	}
	if config.Prompts.OCRPrompt == "" {
		config.Prompts.OCRPrompt = ocrText
	}

	return &config, nil
}
