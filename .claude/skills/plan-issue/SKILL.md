---
name: plan-issue
description: Write an initial functional and technical implementation plan for a GitHub issue. Use when the user runs /plan-issue.
---

Read the current issue's title and body. Account for already existing comments. Write an implementation plan with these sections:

## Functional Plan
- Problem summary
- Proposed behavior / user-facing outcome
- Edge cases to consider

## Technical Plan
- Affected files/modules (inspect the repo to name actual paths)
- Approach / key changes
- Open questions or risks

Post this as a single issue comment. Start the comment body with this exact marker on its own line so it can be found later:
<!-- claude-plan -->

Keep it concise — this is a plan for a human to review, not the implementation itself.

Feel free to add write an additional comment if you think more information are required to properly plan this issue. 
