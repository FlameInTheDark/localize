package translate

import (
	"github.com/FlameInTheDark/localize/internal/ocr"
	"github.com/FlameInTheDark/localize/internal/parsers/mupdf"
	"github.com/FlameInTheDark/localize/internal/translator"
	"github.com/gofiber/fiber/v3"
)

const entityName = "translate"

type Entity struct {
	tr        *translator.Translator
	ocr       *ocr.OCR
	docparser *mupdf.MuPDFParser
}

func NewEntity(tr *translator.Translator, ocr *ocr.OCR, parser *mupdf.MuPDFParser) *Entity {
	return &Entity{
		tr:        tr,
		ocr:       ocr,
		docparser: parser,
	}
}

func (e *Entity) Name() string {
	return entityName
}

func (e *Entity) Register(r fiber.Router) error {
	r.Post("", e.Translate)
	r.Post("/detect", e.DetectLanguage)
	r.Post("/document", e.TranslateDocument)
	r.Post("/ocr", e.OCRImage)
	r.Post("/image", e.TranslateImage)
	return nil
}
