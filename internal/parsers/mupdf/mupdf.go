package mupdf

import (
	"bytes"
	"fmt"
	"image"
	_ "image/png"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"

	"github.com/google/uuid"
)

type MuPDFParser struct {
	// MutoolPath is the path to the mutool binary. Defaults to "mutool" (resolved via PATH).
	MutoolPath string
}

func NewMuPDFParser(ParserPath string) *MuPDFParser {
	return &MuPDFParser{MutoolPath: ParserPath}
}

func (p *MuPDFParser) mutool() string {
	if p.MutoolPath != "" {
		return p.MutoolPath
	}
	return "mutool"
}

// newWorkDir creates a unique temp directory (UUID-named) for one parse operation,
// so concurrent calls never collide, and returns a cleanup func.
func (p *MuPDFParser) newWorkDir() (dir string, cleanup func(), err error) {
	dir = filepath.Join(os.TempDir(), "mupdf-"+uuid.NewString())
	if err = os.MkdirAll(dir, 0o700); err != nil {
		return "", nil, fmt.Errorf("create work dir: %w", err)
	}
	cleanup = func() { os.RemoveAll(dir) }
	return dir, cleanup, nil
}

func (p *MuPDFParser) writeInput(dir string, file []byte) (string, error) {
	inputPath := filepath.Join(dir, uuid.NewString()+".pdf")
	if err := os.WriteFile(inputPath, file, 0o600); err != nil {
		return "", fmt.Errorf("write input file: %w", err)
	}
	return inputPath, nil
}

// numberedFiles finds files matching prefix+"-"+N+ext in dir and returns their
// paths sorted numerically by N (not lexically, so page-2 sorts before page-10).
func numberedFiles(dir, prefix, ext string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile("^" + regexp.QuoteMeta(prefix) + `-(\d+)` + regexp.QuoteMeta(ext) + "$")
	type numbered struct {
		n    int
		path string
	}
	var found []numbered
	for _, e := range entries {
		m := re.FindStringSubmatch(e.Name())
		if m == nil {
			continue
		}
		n, err := strconv.Atoi(m[1])
		if err != nil {
			continue
		}
		found = append(found, numbered{n, filepath.Join(dir, e.Name())})
	}

	sort.Slice(found, func(i, j int) bool { return found[i].n < found[j].n })

	paths := make([]string, len(found))
	for i, f := range found {
		paths[i] = f.path
	}
	return paths, nil
}

func (p *MuPDFParser) runMutool(args ...string) error {
	cmd := exec.Command(p.mutool(), args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("mutool %v failed: %w: %s", args, err, stderr.String())
	}
	return nil
}

// ParseToImage renders every page of the PDF to an image via mutool.
func (p *MuPDFParser) ParseToImage(file []byte) (images []*image.RGBA, detected int, extracted int, err error) {
	dir, cleanup, err := p.newWorkDir()
	if err != nil {
		return nil, 0, 0, err
	}
	defer cleanup()

	inputPath, err := p.writeInput(dir, file)
	if err != nil {
		return nil, 0, 0, err
	}

	outPattern := filepath.Join(dir, "page-%d.png")
	if err := p.runMutool("draw", "-o", outPattern, "-r", "150", inputPath); err != nil {
		return nil, 0, 0, err
	}

	pagePaths, err := numberedFiles(dir, "page", ".png")
	if err != nil {
		return nil, 0, 0, fmt.Errorf("list rendered pages: %w", err)
	}
	detected = len(pagePaths)

	for i, path := range pagePaths {
		data, err := os.ReadFile(path)
		if err != nil {
			slog.Warn("Error reading rendered page", slog.Int("page", i+1), slog.String("error", err.Error()))
			continue
		}

		img, _, err := image.Decode(bytes.NewReader(data))
		if err != nil {
			slog.Warn("Error decoding rendered page", slog.Int("page", i+1), slog.String("error", err.Error()))
			continue
		}

		rgba, ok := img.(*image.RGBA)
		if !ok {
			b := img.Bounds()
			converted := image.NewRGBA(b)
			for y := b.Min.Y; y < b.Max.Y; y++ {
				for x := b.Min.X; x < b.Max.X; x++ {
					converted.Set(x, y, img.At(x, y))
				}
			}
			rgba = converted
		}

		images = append(images, rgba)
	}

	return images, detected, len(images), nil
}

// ParseToText extracts text from every page of the PDF via mutool.
func (p *MuPDFParser) ParseToText(file []byte) (pages []string, detected int, extracted int, err error) {
	dir, cleanup, err := p.newWorkDir()
	if err != nil {
		return nil, 0, 0, err
	}
	defer cleanup()

	inputPath, err := p.writeInput(dir, file)
	if err != nil {
		return nil, 0, 0, err
	}

	outPattern := filepath.Join(dir, "text-%d.txt")
	if err := p.runMutool("draw", "-F", "txt", "-o", outPattern, inputPath); err != nil {
		return nil, 0, 0, err
	}

	textPaths, err := numberedFiles(dir, "text", ".txt")
	if err != nil {
		return nil, 0, 0, fmt.Errorf("list extracted text: %w", err)
	}
	detected = len(textPaths)

	for i, path := range textPaths {
		data, err := os.ReadFile(path)
		if err != nil {
			slog.Warn("Error reading extracted text", slog.Int("page", i+1), slog.String("error", err.Error()))
			continue
		}
		pages = append(pages, string(data))
	}

	return pages, detected, len(pages), nil
}
