package translate

type TranslateRequest struct {
	Text     string `json:"text"`
	Language string `json:"language"`
}

type TranslateResponse struct {
	Text string `json:"text"`
}

type DetectLanguageRequest struct {
	Text string `json:"text"`
}

type DetectLanguageResponse struct {
	Language []string `json:"language"`
}

type TranslateDocumentRequest struct {
	Base64File string `json:"base64_file"`
	FileName   string `json:"file_name"`
	Language   string `json:"language"`
}

type TranslateDocumentResponse struct {
	Original    []string `json:"original"`
	Translation []string `json:"text"`
	Detected    int      `json:"detected"`
	Extracted   int      `json:"extracted"`
	Translated  int      `json:"translated"`
}

type OCRImageRequest struct {
	Base64File string `json:"base64_file"`
}

type OCRImageResponse struct {
	Text string `json:"text"`
}

type TranslateImageRequest struct {
	Base64File string `json:"base64_file"`
	Language   string `json:"language"`
}

type TranslateImageResponse struct {
	Original    string `json:"original"`
	Translation string `json:"translation"`
}
