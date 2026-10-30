/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Chave da REST Countries API v5 (https://restcountries.com/api-keys) */
  readonly VITE_RESTCOUNTRIES_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
