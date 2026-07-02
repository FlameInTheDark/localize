package ocr

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"net/http"
	"strings"
	"text/template"

	"github.com/FlameInTheDark/localize/internal/llm"
)

type OCR struct {
	provider    llm.Provider
	ocrTemplate *template.Template
}

func NewOCR(provider llm.Provider, ocrPrompt string) (*OCR, error) {
	otmpl, err := template.New("OCRPrompt").Parse(ocrPrompt)
	if err != nil {
		return nil, err
	}
	return &OCR{
		provider:    provider,
		ocrTemplate: otmpl,
	}, nil
}

func (o *OCR) ExtractText(ctx context.Context, image []byte) (string, error) {
	data := image
	if len(image) > 512 {
		data = data[:512]
	}
	mimeType := http.DetectContentType(data)
	mimeTypeParts := strings.Split(mimeType, "/")
	if (len(mimeTypeParts) < 2 || mimeTypeParts[0] != "image") &&
		(mimeTypeParts[1] != "png" && mimeTypeParts[1] != "jpeg" && mimeTypeParts[1] != "jpg" && mimeTypeParts[1] != "webp") {
		return "", errors.New("unsupported media type")
	}

	var tpl bytes.Buffer
	err := o.ocrTemplate.ExecuteTemplate(&tpl, "OCRPrompt", nil)
	if err != nil {
		return "", err
	}

	prompt := tpl.String()
	return o.provider.QueryMedia(ctx, prompt, "", mimeType, "data:"+mimeType+";base64,"+base64.StdEncoding.EncodeToString(image))
}
