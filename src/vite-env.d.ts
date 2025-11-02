/// <reference types="vite/client" />

interface Window {
  paypal?: any;
}

interface ImportMetaEnv {
  readonly VITE_PAYPAL_CLIENT_ID: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
