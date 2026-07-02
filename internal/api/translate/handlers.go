package translate

import (
	"bytes"
	"encoding/base64"
	"image/jpeg"
	"log/slog"

	"github.com/gofiber/fiber/v3"
)

// Translate
//
//	@Summary	Translate text to specified language
//	@Produce	json
//	@Tags		translate
//	@Param		request	body		TranslateRequest	true	"Translate request data"
//	@Success	200		{object}	TranslateResponse	"Translated text"
//	@failure	400		{string}	string				"Bad request"
//	@failure	500		{string}	string				"Internal server error"
//	@Router		/translate [post]
func (e *Entity) Translate(c fiber.Ctx) error {
	req := new(TranslateRequest)
	err := c.Bind().Body(req)
	if err != nil {
		slog.Info("Error parsing request: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}
	tr, err := e.tr.Translate(c.Context(), req.Text, req.Language)
	if err != nil {
		slog.Info("Translation error: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.JSON(TranslateResponse{Text: tr})
}

// DetectLanguage
//
//	@Summary	Translate text to specified language
//	@Produce	json
//	@Tags		translate
//	@Param		request	body		DetectLanguageRequest	true	"Translate request data"
//	@Success	200		{object}	DetectLanguageResponse	"Translated text"
//	@failure	400		{string}	string					"Bad request"
//	@failure	500		{string}	string					"Internal server error"
//	@Router		/translate/detect [post]
func (e *Entity) DetectLanguage(c fiber.Ctx) error {
	req := new(DetectLanguageRequest)
	err := c.Bind().Body(req)
	if err != nil {
		slog.Info("Error parsing request: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}
	dt, err := e.tr.Detect(c.Context(), req.Text)
	if err != nil {
		slog.Info("Language detection error: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusInternalServerError)
	}
	return c.JSON(DetectLanguageResponse{Language: dt})
}

// TranslateDocument
//
//	@Summary	Parses document (PDF, EPUB, MOBI, DOCX, XLSX and PPTX) and translates text to specified language
//	@Produce	json
//	@Tags		translate
//	@Param		request	body		TranslateDocumentRequest	true	"Translate document request data"
//	@Success	200		{object}	TranslateDocumentResponse	"Translated text"
//	@failure	400		{string}	string						"Bad request"
//	@failure	500		{string}	string						"Internal server error"
//	@Router		/translate/document [post]
func (e *Entity) TranslateDocument(c fiber.Ctx) error {
	req := new(TranslateDocumentRequest)
	err := c.Bind().Body(req)
	if err != nil {
		slog.Info("Error parsing request: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	b, err := base64.StdEncoding.DecodeString(req.Base64File)
	if err != nil {
		slog.Info("Error parsing base64 file: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	images, detected, extracted, err := e.docparser.ParseToImage(b)
	if err != nil {
		slog.Info("Error parsing document: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusInternalServerError)
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
		text, err := e.ocr.ExtractText(c.Context(), buf.Bytes())
		if err != nil {
			slog.Info("Error extracting text from image: ", slog.String("error", err.Error()))
			continue
		}
		pages = append(pages, text)
	}

	var translated []string

	for _, page := range pages {
		translatedPage, err := e.tr.Translate(c.Context(), page, req.Language)
		if err != nil {
			slog.Info("Error translating text: ", slog.String("error", err.Error()))
			continue
		}
		translated = append(translated, translatedPage)
	}

	return c.JSON(TranslateDocumentResponse{
		Original:    pages,
		Translation: translated,
		Detected:    detected,
		Extracted:   extracted,
		Translated:  len(translated),
	})
}

// OCRImage
//
//	@Summary	Extract text from image
//	@Produce	json
//	@Tags		translate
//	@Param		request	body		OCRImageRequest		true	"Image request data"
//	@Success	200		{object}	OCRImageResponse	"Text"
//	@failure	400		{string}	string				"Bad request"
//	@failure	500		{string}	string				"Internal server error"
//	@Router		/translate/ocr [post]
func (e *Entity) OCRImage(c fiber.Ctx) error {
	req := new(OCRImageRequest)
	err := c.Bind().Body(req)
	if err != nil {
		slog.Info("Error parsing request: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	b, err := base64.StdEncoding.DecodeString(req.Base64File)
	if err != nil {
		slog.Info("Error parsing base64 file: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	text, err := e.ocr.ExtractText(c.Context(), b)
	if err != nil {
		slog.Info("Error extracting text from image: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	return c.JSON(OCRImageResponse{Text: text})
}

// TranslateImage
//
//	@Summary	Extract text from image and translate it to specified language
//	@Produce	json
//	@Tags		translate
//	@Param		request	body		TranslateImageRequest	true	"Image request data"
//	@Success	200		{object}	TranslateImageResponse	"Translation text"
//	@failure	400		{string}	string					"Bad request"
//	@failure	500		{string}	string					"Internal server error"
//	@Router		/translate/image [post]
func (e *Entity) TranslateImage(c fiber.Ctx) error {
	req := new(TranslateImageRequest)
	err := c.Bind().Body(req)
	if err != nil {
		slog.Info("Error parsing request: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	b, err := base64.StdEncoding.DecodeString(req.Base64File)
	if err != nil {
		slog.Info("Error parsing base64 file: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	text, err := e.ocr.ExtractText(c.Context(), b)
	if err != nil {
		slog.Info("Error extracting text from image: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusBadRequest)
	}

	translation, err := e.tr.Translate(c.Context(), text, req.Language)
	if err != nil {
		slog.Info("Error translating text: ", slog.String("error", err.Error()))
		return c.SendStatus(fiber.StatusInternalServerError)
	}

	return c.JSON(TranslateImageResponse{Original: text, Translation: translation})
}
