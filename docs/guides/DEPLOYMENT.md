# Deployment

The daemon deployment lives in a separate private repo: **emergex-vessel** (`~/emergex-vessel/`).

This keeps deployment secrets, infrastructure config, and cloud credentials out of the public emergex-code repo.

## The Vessel

"The Vessel" is the cloud container that runs the emergex daemon. It pulls emergex-code at build time and runs `packages/daemon/index.ts` with OpenRouter as the default LLM provider.

- **App name:** eight-vessel
- **Platform:** Fly.io
- **Region:** dub (Dublin)
- **Endpoint:** `wss://eight-vessel.fly.dev`

## Local Development

Run the daemon locally (no Docker needed):

```bash
bun run packages/daemon/index.ts
```

Test the WebSocket protocol:

```bash
bun run scripts/test-ws-client.ts
```

## Cloud Testing

Test against the deployed vessel:

```bash
DAEMON_URL=wss://eight-vessel.fly.dev bun run scripts/test-ws-client.ts
```

## Deployment Instructions

See the README in the emergex-vessel repo for full deploy commands.

## Architecture

```
emergex-code (public, GitHub)
  +-- packages/daemon/     <- the kernel
  +-- docs/DAEMON-PROTOCOL.md  <- the contract

emergex-vessel (private)
  +-- Dockerfile           <- pulls emergex-code, runs daemon
  +-- fly.toml             <- Fly.io config (eight-vessel, dub)
  +-- .env.example         <- required env vars

Fly.io (eight-vessel, dub)
  +-- Bun runtime
  +-- WebSocket gateway (:18789)
  +-- OpenRouter (LLM inference)
  +-- /root/.emergex/ (persistent volume: eight_data)
```
