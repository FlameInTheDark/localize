package translator

import (
	"bytes"
	"context"
	_ "embed"
	"strings"
	"text/template"

	"github.com/FlameInTheDark/localize/internal/llm"
)

type Translator struct {
	provider            llm.Provider
	translateSystemTmpl *template.Template
	detectSystemTmpl    *template.Template
}

func NewTranslator(provider llm.Provider, translatePrompt string, detectPrompt string) (*Translator, error) {
	trtmpl, err := template.New("TranslatePrompt").Parse(translatePrompt)
	if err != nil {
		return nil, err
	}
	dttmpl, err := template.New("DetectPrompt").Parse(detectPrompt)
	if err != nil {
		return nil, err
	}
	return &Translator{
		provider:            provider,
		translateSystemTmpl: trtmpl,
		detectSystemTmpl:    dttmpl,
	}, nil
}

func (t *Translator) Translate(ctx context.Context, text string, lang string) (string, error) {
	var tpl bytes.Buffer
	data := struct {
		Lang string
	}{
		Lang: lang,
	}
	err := t.translateSystemTmpl.ExecuteTemplate(&tpl, "TranslatePrompt", data)
	if err != nil {
		return "", err
	}
	system := tpl.String()
	return t.provider.Query(ctx, text, system)
}

func (t *Translator) Detect(ctx context.Context, text string) ([]string, error) {
	var tpl bytes.Buffer
	err := t.detectSystemTmpl.ExecuteTemplate(&tpl, "DetectPrompt", nil)
	if err != nil {
		return nil, err
	}
	system := tpl.String()
	resp, err := t.provider.Query(ctx, text, system)
	if err != nil {
		return nil, err
	}

	return strings.Split(strings.ReplaceAll(strings.ReplaceAll(resp, "\n", ""), " ", ""), ","), nil
}
