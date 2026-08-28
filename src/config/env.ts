export const env = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Stratos Wallet',
  // Base URL of the Docusaurus docs site. DemoBadge links point here so a
  // visitor can jump from "what is this feature demonstrating" straight to
  // the ADR/story/quiz that explains it. Defaults to the local docs dev
  // server; set VITE_DOCS_URL in production to the deployed docs domain.
  docsUrl: import.meta.env.VITE_DOCS_URL ?? 'http://localhost:7700',
}
