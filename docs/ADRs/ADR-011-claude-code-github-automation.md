# ADR-011: claude-code-action for AI-Assisted GitHub Automation

## Status

Accepted

## Context

The goal is an end-to-end AI-assisted development loop that lives entirely inside GitHub: write an issue, get an implementation plan, refine that plan through comments, spawn an agent to implement it and open a PR, get code review on the PR, and have the agent act on review feedback. It needs to be self-hosted / low-cost — not a paid managed SaaS (CodeRabbit, Devin, etc.) — and not dependent on Claude Code Cloud.

Two routes were compared:

1. **A fully custom agent**: our own webhook receiver, our own sandboxing/isolation, our own toolchain images.
2. **Anthropic's official [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action) GitHub Action**, running on our own GitHub Actions runner.

The hard part of the custom route isn't the AI calls or the skills — it's securely sandboxing an agent that has shell access and a GitHub write token against prompt injection from comments on a public repo (proper isolation, network egress control, ephemeral scoped tokens). That's a substantial, security-critical undertaking on its own.

## Decision

Use `anthropics/claude-code-action@v1` as the execution engine for AI-assisted GitHub automation, one purpose-built workflow/job per command (see [docs/ai-github-automation.md](../ai-github-automation.md) for the current implementation).

Key choices within that:

- **Runs on our own GitHub Actions runner** — no third-party cloud dependency beyond GitHub itself and the Anthropic API.
- **Currently authenticated via a Claude Pro/Max subscription OAuth token** (`claude setup-token`), not a pay-per-token Anthropic API key. This is a swappable input, not an architectural commitment: `claude-code-action` natively supports API-key billing, Amazon Bedrock, Google Vertex AI, and Microsoft Foundry as alternative auth backends, so moving off the subscription token later (e.g. once usage or reliability needs outgrow it) is a config change to the workflow's `with:` block, not a redesign. Chosen for now because it's already paid for and zero marginal cost per run. Accepted tradeoff while on it: usage/rate limits are shared with interactive Claude Code use, and the token needs periodic refresh.
- **Automation ("agent") mode with an explicit, hardcoded `prompt` per command**, not tag/interactive mode. The workflow's own `if:` condition decides which command applies (exact-prefix match on the triggering comment) and hands Claude a fixed instruction (e.g. the literal `/refine`) — Claude never has to infer which skill to run from free-form comment text.
- **Tool access explicitly allowlisted per job**, kept to the minimum each command's skill needs (see the security model doc for specifics). No general `Bash`, no `Write`/`Edit` by default.
- **Public repo, gated to maintainers/collaborators** via `author_association` — random public commenters can't trigger it or burn API spend.

The first slice built on this foundation is issue planning (the `/refine` command — see [docs/ai-github-automation.md](../ai-github-automation.md)). Implementation (issue → code → PR), PR review, and review-feedback loops are planned to follow the same pattern.

## Consequences

### Positive

- Orchestration, GitHub event triggering, and tool-use plumbing are already solved and maintained upstream by Anthropic — this would otherwise be the bulk of a custom agent's implementation effort.
- Runs on our own runner; no data or execution leaves GitHub Actions + the Anthropic API.
- Tool access is still fully controllable via `claude_args --allowedTools`, so the security posture of a custom agent (least-privilege tool grants) is achievable without building the sandboxing ourselves.
- Automation mode plus one job per command gives deterministic routing and per-command permission scoping without needing our own dispatcher.
- Not locked into one billing/hosting model: the auth backend (subscription OAuth token, metered API key, Bedrock, Vertex, Foundry) is an input to the action, so it can change without touching the workflow logic, the skills, or the permission model as usage patterns change.

### Negative

- **Currently on subscription-token auth specifically** (not inherent to the platform choice): usage/rate limits are shared with interactive Claude Code sessions, and the token requires periodic manual refresh. Switching to metered API billing or Bedrock/Vertex removes this specific tradeoff whenever it's worth the cost.
- Less control than a fully custom agent would offer (e.g. no custom network egress control, no bespoke sandbox).
- The action's mode-detection and permission semantics aren't always obvious from the outside — getting tool permissions and trigger precision right took several iterations of live debugging on the first command built this way.
- Scales via one workflow/job per command rather than a single generic dispatcher, which means some YAML duplication as more commands are added — accepted deliberately so each command can carry its own least-privilege permission scope (see the security model doc).

## Alternatives Considered

- **Fully custom agent** (own webhook receiver, own sandboxing, own toolchain images): rejected for now. The security-critical part — safely sandboxing shell + GitHub write-token access against prompt injection from public-repo comments — is a significant undertaking on its own, and `claude-code-action` already solves the orchestration problem that would otherwise be built around that sandbox. Revisit if `claude-code-action`'s constraints (mode detection, tool-permission model, per-job dispatch) become genuinely limiting.
- **Paid managed SaaS** (CodeRabbit-style issue/PR automation, Devin, etc.): rejected for this initiative on cost and vendor-dependency grounds. Note CodeRabbit is already used elsewhere in this repo's process (see [docs/ai-development-process.md](../ai-development-process.md)) for PR-level planning/review — whether that role eventually moves onto this Claude-based automation, or the two continue to coexist, is an open question to revisit as more of the loop (implementation, PR review) gets built here.
