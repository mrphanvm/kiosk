/// <reference types="vite/client" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SSE_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
