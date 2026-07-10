/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_TEMPLATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
