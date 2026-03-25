GitHub Pages + Secure Chat Deploy (No Key Leak)

1) Keep your API key out of repo
- Do not put real keys in .env, secrets.toml, script.js, or config.js.
- Key must only be in GitHub Secrets / Cloudflare secret.

2) Cloudflare Worker setup (secure proxy)
- Files already added:
  - worker/src/index.js
  - worker/wrangler.toml
  - .github/workflows/deploy-worker.yml

3) Add required GitHub Secrets
Repository -> Settings -> Secrets and variables -> Actions -> New repository secret

For worker deploy:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID
- COHERE_API_KEY
- ALLOWED_ORIGIN (example: https://nikkyzzzz.github.io)

For pages deploy:
- CHAT_API_URL (example: https://nikita-portfolio-chat-proxy.<subdomain>.workers.dev/api/chat)
- GITHUB_URL
- LINKEDIN_URL
- PROJECT_AUDIT_URL
- PROJECT_PAN_URL
- PROJECT_LUNG_URL
- FORMSPREE_ENDPOINT

4) Deploy flow
- Push to main.
- Worker workflow deploys secure chat backend.
- Set CHAT_API_URL secret to worker endpoint.
- Push again (or rerun Deploy GitHub Pages workflow).

5) Verify
- Open deployed site.
- Assistant should not show "Chat API URL not configured".
- Ask a question in assistant and check live response.

Notes
- GitHub Pages is static. It cannot safely call Cohere directly with secret key.
- Worker keeps key server-side, so key is not leaked in frontend.
