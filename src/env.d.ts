/// <reference types="vite/client" />

// this file is required for environment variable typings
// source: https://vitejs.dev/guide/env-and-mode

interface ImportMetaEnv {
  readonly DATA_SERVICES_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}