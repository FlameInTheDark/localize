/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL (empty = same-origin). See src/lib/api.ts. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
