/**
 * Backend API base URL, resolved at BUILD time.
 *
 * The value is inlined by Vite from the `VITE_API_BASE_URL` env var:
 *
 * - **Empty / unset** → the app calls `/api/v1/*` on the SAME origin it is
 *   served from. Use this when the static bundle is embedded in (and served
 *   by) the Go backend — e.g. the app is opened at `http://localhost:8080`
 *   and the API lives at `http://localhost:8080/api/v1/*`.
 *
 * - **Absolute URL** (e.g. `http://localhost:8080`) → the app calls that
 *   origin. Use this for local dev (Vite on :3000 talking to your Go backend
 *   on :8080) or when the frontend is hosted separately from the API.
 *
 * Build variants (see Makefile):
 *   make build-origin   → VITE_API_BASE_URL is empty   (embed in Go)
 *   make build-custom   → VITE_API_BASE_URL=<api base> (dev/separate)
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/+$/, "");

/**
 * Build a fully-qualified backend URL for a given API path.
 *
 * @example apiUrl("/api/v1/translate")       // ""      + "/api/v1/translate"
 * @example apiUrl("/api/v1/translate/detect") // "http://localhost:8080" + "/api/v1/translate/detect"
 */
export function apiUrl(path: string): string {
  // Ensure exactly one slash between base and path.
  const separator = API_BASE_URL && !path.startsWith("/") ? "/" : "";
  return `${API_BASE_URL}${separator}${path}`;
}
