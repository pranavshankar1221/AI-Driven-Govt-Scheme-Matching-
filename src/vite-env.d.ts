/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_AGENT_PHONE_NUMBER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
