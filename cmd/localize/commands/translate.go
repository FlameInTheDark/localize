package commands

import (
	"bytes"
	"context"
	"fmt"
	"image/jpeg"
	"log/slog"
	"os"
	"strings"

	"github.com/FlameInTheDark/localize/internal/config"
	"github.com/FlameInTheDark/localize/internal/llm/ollama"
	"github.com/FlameInTheDark/localize/internal/ocr"
	"github.com/FlameInTheDark/localize/internal/parsers/mupdf"
	"github.com/FlameInTheDark/localize/internal/translator"
	"github.com/jedib0t/go-pretty/v6/table"

	"github.com/urfave/cli/v3"
)

func TranslateCommand() *cli.Command {
	return &cli.Command{
		Name:  "translate",
		Usage: "Translate commands",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "language",
				Aliases: []string{"l"},
				Usage:   "Language to translate to (EN, FR, English, French, etc)",
			},
		},
		Commands: []*cli.Command{
			translateText(),
			detectTextLanguages(),
			translateImage(),
			translateDocument(),
		},
	}
}

func translateText() *cli.Command {
	command := &cli.Command{
		Name:  "text",
		Usage: "Translate text",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "text",
				Aliases: []string{"t"},
				Usage:   "Text to translate",
			},
		},
		Action: func(ctx context.Context, c *cli.Command) error {
			if c.String("text") == "" {
				fmt.Println("Text to translate is required")
				return nil
			}

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

			trs, err := translator.NewTranslator(trol, cfg.Prompts.TranslatePrompt, cfg.Prompts.DetectPrompt)
			if err != nil {
				slog.Error("Error initializing translator: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			res, err := trs.Translate(ctx, c.String("text"), c.String("language"))
			if err != nil {
				slog.Error("Error translating text: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			fmt.Println(res)
			return nil
		},
	}
	return command
}

func detectTextLanguages() *cli.Command {
	command := &cli.Command{
		Name:  "detect",
		Usage: "Detect text laguages",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "text",
				Aliases: []string{"t"},
				Usage:   "Text to translate",
			},
		},
		Action: func(ctx context.Context, c *cli.Command) error {
			if c.String("text") == "" {
				fmt.Println("Text to translate is required")
				return nil
			}

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

			trs, err := translator.NewTranslator(trol, cfg.Prompts.TranslatePrompt, cfg.Prompts.DetectPrompt)
			if err != nil {
				slog.Error("Error initializing translator: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			res, err := trs.Detect(ctx, c.String("text"))
			if err != nil {
				slog.Error("Error detecting text languages: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			fmt.Println(strings.Join(res, ", "))
			return nil
		},
	}
	return command
}

func translateImage() *cli.Command {
	return &cli.Command{
		Name:  "image",
		Usage: "Translate text on image",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "file",
				Aliases: []string{"f"},
				Usage:   "Path to the image to translate",
			},
		},
		Action: func(ctx context.Context, c *cli.Command) error {
			if c.String("file") == "" {
				fmt.Println("Image file path is required")
				return nil
			}
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
			f, err := os.ReadFile(c.String("file"))
			if err != nil {
				slog.Error("Error reading image file: ", slog.String("error", err.Error()))
				os.Exit(1)
			}
			imageText, err := ocrs.ExtractText(ctx, f)
			if err != nil {
				slog.Error("Error extracting text from image: ", slog.String("error", err.Error()))
				os.Exit(1)
			}
			res, err := trs.Translate(ctx, imageText, c.String("language"))
			if err != nil {
				slog.Error("Error translating text: ", slog.String("error", err.Error()))
			}
			fmt.Println(res)
			return nil
		},
	}
}

func translateDocument() *cli.Command {
	return &cli.Command{
		Name:  "document",
		Usage: "Translate document",
		Flags: []cli.Flag{
			&cli.StringFlag{
				Name:    "file",
				Aliases: []string{"f"},
				Usage:   "Path to the document to translate",
			},
			&cli.StringFlag{
				Name:    "mutool",
				Aliases: []string{"m"},
				Usage:   "mutool executable path, defaults to 'mutool' in PATH",
			},
		},
		Action: func(ctx context.Context, c *cli.Command) error {
			if c.String("file") == "" {
				fmt.Println("Document file path is required")
				return nil
			}
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

			if c.String("mutool") != "" {
				cfg.MuToolPath = c.String("mutool")
			}

			parser := mupdf.NewMuPDFParser(cfg.MuToolPath)
			f, err := os.ReadFile(c.String("file"))
			if err != nil {
				slog.Error("Error reading document file: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			images, detected, extracted, err := parser.ParseToImage(f)
			if err != nil {
				slog.Error("Error parsing document: ", slog.String("error", err.Error()))
				os.Exit(1)
			}

			var pages []string
			var buf bytes.Buffer
			for _, img := range images {
				buf.Reset()
				err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
				if err != nil {
					slog.Info("Error encoding image: ", slog.String("error", err.Error()))
					continue
				}
				text, err := ocrs.ExtractText(ctx, buf.Bytes())
				if err != nil {
					slog.Info("Error extracting text from image: ", slog.String("error", err.Error()))
					continue
				}
				pages = append(pages, text)
			}

			var translated []string

			for _, page := range pages {
				translatedPage, err := trs.Translate(ctx, page, c.String("language"))
				if err != nil {
					slog.Info("Error translating text: ", slog.String("error", err.Error()))
					continue
				}
				translated = append(translated, translatedPage)
			}

			// Create a new table writer
			t := table.NewWriter()
			t.SetOutputMirror(os.Stdout) // Output directly to the console

			// Add a title for context
			t.SetTitle("Translation Summary")

			// Define the headers
			t.AppendHeader(table.Row{
				"Detected",
				"Extracted",
				"Parsed (OCR)",
				"Translated",
			})

			// Add the data row
			t.AppendRow(table.Row{
				detected,
				extracted,
				len(pages),
				len(translated),
			})

			// Optional: Add some styling to make it look modern
			t.SetStyle(table.StyleRounded)
			// Turn off the auto-indexing (the row numbers on the left)
			t.Style().Options.DrawBorder = true
			t.Style().Options.SeparateRows = false

			// Render the table to the console
			t.Render()

			for i, page := range pages {
				fmt.Println("Page", i+1, ":\n", page)
			}

			return nil
		},
	}
}
