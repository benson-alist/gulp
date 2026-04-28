---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Interview the user relentlessly about every aspect of their plan or design until reaching shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one at a time.

## Instructions

1. Ask questions **one at a time** — never batch multiple questions in a single turn.
2. For each question, provide your **recommended answer** so the user can agree, disagree, or adjust.
3. If a question can be answered by exploring the codebase, **explore the codebase instead** of asking.
4. Walk the decision tree branch-by-branch, resolving dependencies between decisions before moving on.
5. Continue until you and the user share a complete understanding of the plan.

## Question Format

Each question should:

- Target a single decision point
- Include your recommended answer with brief reasoning
- Build on previously resolved decisions

**Example:**

> Should user sessions be stored server-side or as stateless JWTs?
>
> **My recommendation:** Server-side sessions in Redis — simpler to revoke, and you already have Redis in the stack. Stateless JWTs add complexity you don't need for a single-tenant app.

## When to Explore Instead of Ask

Before asking a question, check if the codebase already answers it:

- Existing conventions (file layout, naming, patterns)
- Current dependencies and versions
- Existing abstractions that constrain the design

Only ask the user about decisions the codebase can't answer.

## Credits

Adapted from [mattpocock/skills/grill-me](https://github.com/mattpocock/skills/blob/main/grill-me/SKILL.md).
