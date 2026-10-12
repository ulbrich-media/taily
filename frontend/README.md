# Taily React Application

## Setup

1. Make sure you have node and npm installed
2. Install certificates
   1. `brew install mkcert`
   2. `mkcert -install`
   3. `mkdir .cert`
   4. Generate certificates with `mkcert -key-file .cert/key.pem -cert-file .cert/cert.pem taily.ddev.site`
3. Copy `.env.local.example` to `.env.local`
4. Install dependencies with `npm install`

## Development

Start the dev server with `npm run dev`. You have to access the frontend through [taily.ddev.site:5544](https://taily.ddev.site:5544/) for the login and api to work.

### Worktrees

In a git worktree (e.g. Dispatch workspaces) run `scripts/worktree-init.sh` once from the repository root. It gives the worktree its own DDEV project, hostnames, `.env` files, Vite port and TLS cert (`https://<worktree>.taily.ddev.site:<port>`, API at `https://api.<worktree>.taily.ddev.site`), so several checkouts can run in parallel and the login cookie domain stays correct.

Available commands:

```bash
npm run dev          # Start the environment
npm run build        # Build the application
npm run lint         # Run linter checks
npm run lint:fix     # Run linter with auto fix
npm run format       # Run prettier checks
npm run format:fix   # Run prettier with auto fix
npm run flightcheck  # Run all checks
```
