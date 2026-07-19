---
name: refine-plan
description: Revise the existing implementation plan based on new feedback in the issue comments. Use when the user runs /refine-plan.
---

Find the existing comment on this issue containing the marker `<!-- claude-plan -->`.
Read all comments posted to the issue — that's the feedback to incorporate.

Rewrite the full plan (same Functional Plan / Technical Plan structure as written bei the initial plan-issue skill) incorporating that feedback.

Edit the existing marked comment in place using the GitHub API (`gh api` or the GitHub CLI) rather than posting a new comment — keep the same `<!-- claude-plan -->` marker at the top so future refinements can find it again.

Feel free to write a comment when you feel like additional feedback is required to write a proper plan. This can also be useful when comments contradict each other, even though the later comment is usually more relevant.  

Edit the existing marked comment using:
`gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH -f body="$(cat plan.md)"`

Find {comment_id} by listing issue comments via:
`gh api repos/{owner}/{repo}/issues/{issue_number}/comments`
