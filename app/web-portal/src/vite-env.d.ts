/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
  readonly VITE_BACKEND_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*/tailwind.config' {
  const config: {
    theme?: {
      extend?: {
        colors?: Record<string, unknown>
        spacing?: Record<string, unknown>
        animation?: Record<string, unknown>
      }
    }
  }
  export default config
}
