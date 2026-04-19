# AI-Assisted Development Process

## Overview

A semi-automated development workflow using GitHub Issues, CodeRabbit, and Claude Code can be used for Taily. The process keeps humans in control at every decision point while delegating implementation and review grunt work to AI.

---

## The Process

### 1. Write the GitHub Issue

**You** write a feature or bugfix issue in GitHub. Focus on **what** you want, not how. Include:
- User-facing goal
- Acceptance criteria
- Any known constraints or edge cases

---

### 2. CodeRabbit Issue Planning

Trigger CodeRabbit's IssuePlanner on the issue. It will produce an explicit implementation plan covering affected files, logic changes, and test requirements.

- Review the plan in the issue thread
- Comment changes directly — CodeRabbit will adjust
- Repeat until the plan accurately reflects your intent
- **Goal:** A plan explicit enough that Claude Code can implement without guessing

---

### 3. Claude Code Implementation

Start a Claude Code session with the finalized issue and implementation plan as context.

Claude Code must:
- Implement the feature as specified in the plan
- Write PHPUnit tests for all new backend business logic and services
- Write React Testing Library tests for critical user interactions (not component internals)
- Run linters and the full test suite locally before finishing

---

### 4. Open a Pull Request

Claude Code opens a PR against the development branch once implementation is complete and tests pass locally.

---

### 5. CodeRabbit Code Review

CodeRabbit automatically reviews the PR and posts inline feedback.

---

### 6. Filter CodeRabbit Feedback

**You** go through CodeRabbit's comments and close anything you consider unnecessary or out of scope. What remains is a filtered, approved list of adjustments.

Then instruct Claude Code to implement all open (non-closed) feedback items.

---

### 7. Your Code Review

Do a high-level code review of the PR yourself. Focus on:
- Architecture and approach
- Anything CodeRabbit wouldn't catch (business logic correctness, naming, intent)
- Leave comments on the PR for Claude Code to address

---

### 8. Content Review via Codespace

Open the branch in a GitHub Codespace (with dev container and seeded data pre-configured). Test the feature as a user would:
- Does it behave correctly?
- Does the UI make sense?
- Are edge cases handled?

Leave feedback as PR comments.

---

### 9. Claude Code Implements Feedback

Claude Code addresses all open PR comments from steps 7 and 8.

---

### 10. Repeat Until Done

Repeat steps 7–9 until both code and content reviews pass. Then merge.

---

## CI/CD Pipeline (runs on every PR push)

All checks must **pass before merge** — no advisory-only rules.

| Check | Tool |
|---|---|
| PHP linting | Laravel Pint |
| JS linting & formatting | ESLint + Prettier |
| Backend tests | PHPUnit |
| Frontend tests | Jest + React Testing Library |
| Frontend build | Vite build check |

Pipeline runs on GitHub Actions.

---

## Testing Philosophy

- **No coverage targets** — they incentivize bad tests
- **Backend:** PHPUnit for business logic and service classes
- **Frontend:** React Testing Library for critical user flows only — not component internals
- Tests are written **during implementation**, not after
- E2E tests are out of scope for now
