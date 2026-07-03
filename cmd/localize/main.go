package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/FlameInTheDark/localize/cmd/localize/commands"
	"github.com/urfave/cli/v3"

	"github.com/FlameInTheDark/localize/internal/api"
	"github.com/FlameInTheDark/localize/internal/api/translate"
	"github.com/FlameInTheDark/localize/internal/config"
	"github.com/FlameInTheDark/localize/internal/llm/ollama"
	"github.com/FlameInTheDark/localize/internal/ocr"
	"github.com/FlameInTheDark/localize/internal/parsers/mupdf"
	"github.com/FlameInTheDark/localize/internal/translator"
)

//	@title			Localize API
//	@version		1.0
//	@description	This is an API for the Localize application.

//	@contact.name	Viktor Menshchikov
//	@contact.url	https://github.com/FlameInTheDark
//	@contact.email	viktorfreedom@gmail.com

//	@license.name	Apache 2.0
//	@license.url	http://www.apache.org/licenses/LICENSE-2.0.html

//	@host		localhost:8080
//	@BasePath	/api/v1
//	@schemes	http https

//	@securitydefinitions.bearerauth	BearerAuth

func main() {
	cmd := &cli.Command{
		Name:  "Localize",
		Usage: "AI Translations",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:  "config",
				Value: "./config.yaml",
				Usage: "Path to the config file",
			},
		},
		Action: serve,
		Commands: []*cli.Command{
			commands.TranslateCommand(),
		},
	}

	if err := cmd.Run(context.Background(), os.Args); err != nil {
		slog.Error("Application error", slog.String("error", err.Error()))
	}
}

func serve(ctx context.Context, c *cli.Command) error {
	cfg, err := config.LoadConfig(c.String("config"))
	if err != nil {
		slog.Error("Error loading config: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	trol := ollama.NewOllama(ollama.OllamaConfig{
		Model:   cfg.Models.Translation.Name,
		Address: cfg.OllamaHost,
	})
	err = trol.Initialize()
	if err != nil {
		slog.Error("Error initializing Ollama for translation: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	ocrol := ollama.NewOllama(ollama.OllamaConfig{
		Model:   cfg.Models.OCR.Name,
		Address: cfg.OllamaHost,
	})
	err = ocrol.Initialize()
	if err != nil {
		slog.Error("Error initializing Ollama for OCR: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	trs, err := translator.NewTranslator(trol, cfg.Prompts.TranslatePrompt, cfg.Prompts.DetectPrompt)
	if err != nil {
		slog.Error("Error initializing translator: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	ocrs, err := ocr.NewOCR(ocrol, cfg.Prompts.OCRPrompt)
	if err != nil {
		slog.Error("Error initializing OCR: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	app := api.NewAPI(cfg.Address)
	err = app.Register(translate.NewEntity(trs, ocrs, mupdf.NewMuPDFParser(cfg.MuToolPath)))
	if err != nil {
		slog.Error("Error registering API entities: ", slog.String("error", err.Error()))
		os.Exit(1)
	}

	go func() {
		err = app.Run()
		if err != nil {
			slog.Error("Error running API: ", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	exitSignal := make(chan os.Signal, 1)
	signal.Notify(exitSignal, syscall.SIGINT, syscall.SIGTERM)

	<-exitSignal

	err = app.Stop()
	if err != nil {
		slog.Error("Error stopping API: ", slog.String("error", err.Error()))
	}
	return nil
}
