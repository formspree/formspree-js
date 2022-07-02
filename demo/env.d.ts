/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string
  readonly VITE_SIMPLE_FORM_ID: string
  readonly VITE_PAYMENT_FORM_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}