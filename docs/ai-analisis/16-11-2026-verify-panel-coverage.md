# Panel coverage verification failure

## Current behavior and evidence

The `verify` run completes static checks and unit tests, but all three panel coverage shards fail while replaying the
shared Playwright setup project. The first attempt in `e2e/specs/10-whatsapp.spec.ts` reaches the WhatsApp account chat
and sees its answer, then incorrectly expects the earlier Telegram message there too. The current channel contract
keeps each owner account in its own chat (`owner_thread: "own"`).

The following scenario expects a stranger notice only in the emulated Telegram account. Owner notices instead use the
configured or first eligible live owner channel, so with both Telegram and WhatsApp available the delivery channel is
not part of this scenario's contract. Once that assertion times out, the contact is left unreviewed and muted. The two
media scenarios then cannot finish their expected contact flow, which accounts for the remaining failures. Playwright
retries against the same core state and produces additional UI assertions that are consequences of the first attempt,
not independent product failures.

Evidence comes from the attached CI logs for coverage shards 1–3 and the current implementations in
`packages/protocol/src/constants.ts`, `apps/core/src/channels/owner-notices.ts`, and the channel E2E setup.

## Constraints

- Preserve the fork's separate owner-account chats and all three customer service modes.
- Keep the setup spec deterministic on every coverage shard.
- Test observable behavior rather than internal implementation or fixed generated account ids.
- Do not weaken the assertion that the owner receives the stranger notice.

## Recommended design

Update the setup spec to assert account-chat isolation: the WhatsApp answer is visible and the earlier Telegram message
is absent. For the stranger notice, accept delivery through either eligible owner channel and assert the same phone,
name, and message content regardless of transport.

## Risks and affected areas

The change is test-only. The main risk is accepting a missing notice; the bounded polling still requires the notice to
exist on one of the two owner channels, and its content assertions remain unchanged. Product code, protocol, persistence,
authorization, service modes, and UI behavior are unaffected.

Affected area: `e2e/specs/10-whatsapp.spec.ts`, which is replayed as setup for every panel coverage shard.

## Verification plan

1. Run the WhatsApp setup project in Playwright when Chromium system libraries are available.
2. Run the repository's test-quality check for the changed E2E source.
3. Let the fork's `verify` workflow exercise all three coverage shards after the owner pushes.

## Unresolved owner decisions

None. The separate account-chat behavior is already an established fork contract.

Docs impact: none — the correction aligns an internal E2E setup with behavior already documented for separate owner
account chats; no user-facing contract changes.
