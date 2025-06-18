/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CIRCLE_API_URL: string;
  readonly VITE_CIRCLE_API_KEY: string;
  readonly VITE_CIRCLE_ESCROW_WALLET_ID: string;
  readonly VITE_CIRCLE_WALLET_ADDRESS: string;
  readonly VITE_CIRCLE_MODULAR_URL: string;
  readonly VITE_CIRCLE_TEST_API_KEY: string;
  // add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
