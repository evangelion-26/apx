# Upstream design integration feasibility

Date: 14-11-2026
Status: assessment complete; no product integration performed

## Objective and comparison baseline

Assess whether the current fork can receive the visual improvements from the official APX repository without losing
its working channel behavior, and identify the smallest set of fork-specific capabilities that must survive.

The stable comparison target is upstream `main` at `v2.14.3` (`ecc5c8080`). The fork is at `28ba119cb`; its last
upstream integration was v2.13.2. Upstream `staging` contains later unreleased work and is not an integration target for
this assessment.

## Current behavior and evidence

The fork adds two related contracts on top of the earlier release:

1. More than one account of the same channel type, with an account-specific initial agent and account-owned chats
   instead of automatic routing through Home.
2. An optional customer-service policy per account: base attention, operation-by-operation super-agent review, or the
   assigned agent's configured tools. Customer identity remains external and owner-only operations remain unavailable.

The previous implementation and verification reports under `docs/ai-analisis/` document those decisions. The current
branch adds 69 paths relative to the common ancestor, principally in channel routing, turn context, tool authorization,
protocol fields, channel settings, tests and bilingual documentation.

Upstream v2.14.3 is not merely a skin refresh. Relative to the common ancestor it changes 1,424 paths, including 485 in
`apps/web`, 364 in `apps/core`, 32 in `packages/ui` and 27 in `packages/protocol`. The released visual redesign alone
changes 519 files under `apps/web` and `packages/ui` since v2.13.2, with 26,899 insertions and 9,928 deletions. It also
changes the data and operations consumed by those screens.

Upstream has independently implemented most of the fork's original multi-account objective:

- multiple accounts of the same channel type;
- an answering agent per account;
- a separate optional agent for contacts and rooms;
- account-owned chats and configurable Home/account routing;
- account contact permissions and response limits;
- a dedicated Channels screen and account dialogs;
- account-aware Inbox rows, filters, contacts and channel identity.

Upstream does **not** contain the fork's `service_mode`, `channel-service.ts` or `channel-review.ts` contract. Its newer
contact permissions overlap with that policy's purpose but do not establish operation-level super-agent review or full
use of the assigned agent's configured tools. Treating them as equivalent would silently remove fork functionality.

## Merge feasibility

A direct merge preview with `git merge-tree --write-tree HEAD upstream/main` fails. Forty-two of the fork's 69 changed
paths also changed upstream. The preview reports conflicts in the channel manager and inbound routing, thread ownership,
context and executor construction, turn execution, channel RPC, settings reach, protocol methods, channel account UI,
translations, tests and the decision record. Three old settings components modified by the fork were deleted upstream,
because channel configuration moved to the new Channels experience.

Therefore:

- **Direct merge and automatic conflict resolution: not viable.** It risks compiling while changing account routing or
  customer authorization semantics.
- **Cherry-picking only CSS/components: not viable as the main strategy.** The new layout depends on new screen
  structure, protocol fields, account/contact operations and lazy-loading boundaries. A partial transplant would create
  a third UI architecture and lose upstream fixes.
- **Upstream-first reconstruction: viable and recommended.** Start from released v2.14.3, accept its redesign and
  canonical multi-account implementation, then reapply only fork behavior that is still absent.

Overall viability is **high**, with **high authorization risk** and **medium data/routing risk**. The work is a controlled
integration, not a cosmetic merge.

## Recommended design

### 1. Use released upstream as the new base

Create one integration worktree and branch from the current fork, merge upstream v2.14.3 preserving both parents, and
resolve the result in favor of upstream's current module and UI structure. Do not target upstream `staging` and do not
activate the result against the owner's live home during development.

Preserve upstream's canonical channel account identity, Channels screen, Inbox representation, contact/room agent
selection, permissions and tests. Remove superseded fork UI rather than recreating deleted settings components.

### 2. Reconcile behavior instead of preserving old code

Build a contract matrix before resolving each overlapping file:

| Required behavior | v2.14.3 status | Integration action |
|---|---|---|
| Multiple accounts per channel type | Present | Use upstream implementation and tests |
| Agent assigned per account | Present | Use upstream `agent_id` semantics |
| Separate contact/room agent | Present, richer than fork | Adopt upstream and map existing settings |
| Owner uses the account chat | Present as `owner_thread: own` | Preserve the owner's configured choice; confirm whether Home must remain prohibited |
| Existing chat keeps history when its agent changes | Similar upstream paths exist | Verify exact cutoff and continuity before declaring parity |
| Base customer attention | Present through contact policy | Map explicitly and regression-test |
| Super-agent review per requested operation | Absent | Port onto the new execution/context boundaries |
| Full assigned-agent tool scope for customers | Absent | Port as an upper bound intersected with upstream contact rights and tool policy |
| Customer never becomes owner | Required by both designs | Retain explicit negative tests |
| Development helper and analysis documents | Fork-only, non-product | Preserve unless the owner chooses to retire them |

Do not copy the old `turn.ts`, `context.ts`, `executor.ts` or settings screens wholesale. Re-express the service policy at
v2.14.3's current audience, permissions and execution extension points. The effective permission must be the
intersection of account service mode, upstream contact rights, assigned agent/project grants, tool confirmation policy
and owner-only restrictions. A mode change must invalidate a waiting operation and must not retroactively authorize an
already dispatched effect.

### 3. Treat the UI as one coherent upstream experience

Use the upstream Channels screen and account dialog as the visual reference. Add the service-mode choice there using
the current design-system controls and sentence-case copy, with English and Spanish parity. Do not restore the former
configuration panels. Review the running result at desktop and phone widths in empty, connected, multiple-account,
review, full-access and error states.

### 4. Protect data before activation

Use an isolated copy of representative fork state to test database startup and migration. Never run the old and new
cores against the same home. Before eventual activation, stop the live core, make a recoverable backup of the configured
home and database, run the release's doctor/upgrade checks, then start only the integrated revision. Code rollback and
data/effect rollback must be planned separately.

## Risks

- **High — authorization:** upstream contact permissions and fork service modes may combine into broader access than
  either intended. Full mode can expose powerful MCP, shell or data tools if intersection rules are wrong.
- **High — identity:** a customer must never acquire owner context, owner-only methods or reusable approval through
  review, delegation or account reassignment.
- **Medium-high — routing:** upstream changed account, contact, room and Home behavior. An apparently clean resolution
  can send a request or reply through the wrong account or agent.
- **Medium-high — data upgrade:** several releases include schema recovery and upgrade work. A source merge says
  nothing about compatibility with the fork's real database lineage.
- **Medium — UI coupling:** the redesigned web application relies on new core/protocol behavior and first-load rules;
  selective component copying can break lazy loading, mobile widths or account actions.
- **Medium — operational effects:** changing a mode can prevent future calls but cannot undo a tool effect already
  dispatched.
- **Medium — scope:** v2.14.3 includes substantial functional changes beyond design. Removing all of them while keeping
  the redesign is not practical or safer than adopting the release and validating the affected contracts.

## Affected areas

- Protocol channel and app method schemas.
- Channel account persistence, inbound routing, contacts, rooms and reply delivery.
- Audience/context construction, delegation, tool selection, executor authorization and review completion.
- Channel RPC and owner settings reach.
- Channels screen, account dialogs, Inbox/channel rows, translations and design-system components.
- Database upgrade/doctor behavior and representative owner data.
- Unit, protocol, browser, desktop and channel E2E fixtures.
- English/Spanish channel documentation, engineering decisions and release news.

Architecture impact: **STRUCTURAL**, because the retained service policy crosses account configuration, context and the
tool authorization boundary. No second transport or agent-to-agent path is needed; channel messages and review work must
continue through the existing router and `threads.send`.

## Verification plan

1. Record a before/after contract matrix for every fork behavior, including negative authorization cases.
2. Run the merge preview and resolve in one isolated worktree; review every overlapping path, not only textual
   conflicts.
3. Run protocol, core, web and static gates, then the complete `pnpm preflight` and `pnpm verify` on the integrated
   revision. Report any platform not exercised as UNVERIFIED.
4. Start the integrated core with a temporary home and confirm its `code_sha`; exercise the changed methods through the
   real client path.
5. Start with an isolated copy of representative fork data; verify migration, account identities, credentials by
   reference, chats, contacts, projects and agent assignments. Do not invoke real external services.
6. Exercise two accounts of the same type and at least two different channel adapters. Verify independent restart,
   inbound routing, reply routing, contact identity and deletion/disconnection isolation.
7. Verify account-agent changes preserve the chat and history, finish admitted turns with their original agent and use
   the new agent only for later admissions.
8. For each service mode, verify available and denied tools, project isolation, customer-specific data boundaries,
   owner-only refusal, reassignment, revocation and mode changes during a waiting call.
9. For review mode, verify one strict decision is bound to the exact account, customer, request, tool and arguments;
   denial, expiry or changed arguments cannot reuse it; no extra customer turn is emitted.
10. Inspect the running UI at desktop and phone widths, in English and Spanish, against upstream v2.14.3 screenshots.
11. Only after all isolated checks pass, prepare a separate activation and rollback plan for the owner's instance.

No product code was merged, no database was opened or migrated, no live core was restarted, and no external channel or
tool was invoked in this assessment. Runtime compatibility, visual parity and data upgrade remain **UNVERIFIED**.

## Owner decisions required before implementation

1. Confirm v2.14.3, rather than unreleased upstream `staging`, as the integration target.
2. Confirm that the fork's three customer-service modes must remain, despite upstream's newer contact permissions.
3. Decide whether `owner_thread: home` must remain prohibited for every account, or whether upstream's configurable
   Home/account choice is acceptable.
4. Confirm that upstream functional additions may remain when they are dependencies of the redesign, subject to the
   contract and security review above.

## Recommendation

Proceed only with an **upstream-first controlled integration**. The essential fork value to rescue is the explicit
customer-service authorization policy and any stricter owner/account routing decision, not the old UI or duplicated
multi-account implementation. A design-only cherry-pick or ordinary merge should be rejected.

Release decision at this stage: **NO-GO for activation; GO for an isolated integration branch after the four owner
decisions above.**

Docs impact: updated — this assessment records the comparison, recommended integration design, risks, affected areas,
verification plan and unresolved owner decisions. An implementation must update the affected English and Spanish user
documentation in the same change.
