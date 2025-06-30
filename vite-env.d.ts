/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_OPENROUTER_MODEL: string
  readonly VITE_SITE_URL: string
  readonly VITE_SITE_NAME: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_AI_FEATURES: string
  readonly VITE_ENABLE_SEARCH_FEATURES: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}