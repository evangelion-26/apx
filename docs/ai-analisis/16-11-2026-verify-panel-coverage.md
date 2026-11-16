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

## Follow-up verification run

The next attached run passes static checks and unit tests. Coverage fails in two panel specs introduced by the merged
design:

- `132-message-channel-badge.spec.ts` still selects the Telegram account by the old generic platform label. Account
  navigation now uses the configured account name (`Acme Desk` in the sandbox), as the other channel specs do.
- `143-agent-fallbacks.spec.ts` selects two fallback models without waiting for the first asynchronous save. Both UI
  updates can therefore start from the empty list and the later save leaves only `custom/fake-2`. A retry then reuses
  the same persistent sandbox and collides with the agent created by the failed attempt.

The repair selects Telegram through the shared sandbox account-name fixture, waits for each fallback to be persisted
before adding the next one, and gives every Playwright retry its own agent id. Assertions for adding, ordering,
removing, fallback execution, and reply metadata remain in place. The Flow connection scenario passed on retry and is
not changed without deterministic failure evidence.

Docs impact: none — these are internal E2E synchronization and selector repairs; product behavior and owner-facing
instructions do not change.

## Final coverage follow-up

The subsequent run passes static checks, lightness budgets, and every unit-test shard. Its only failure is panel
coverage shard 1, where `132-message-channel-badge.spec.ts` opens the configured Telegram account successfully and
then waits for an owner-row button whose accessible name starts with the Spanish `Vos`. The panel can start this shard
in English, where the same row starts with `You`, so both the initial attempt and retry exhaust the test timeout.

The selector now accepts the two supported UI languages and is scoped to the channel's conversation list. The account
selection, message and reply assertions, and the check that the Telegram exchange is absent from Home remain unchanged.

Docs impact: none — this is a language-independent E2E selector correction with no product or user-facing behavior
change.

## Shard-isolation follow-up

The latest run shows that accepting both UI languages was necessary but not sufficient. Panel coverage shard 1 opens
the Telegram account and then finds no owner row in either language. `ChannelScreen` renders that row only after the
account has an address linked to the owner. The previous test depended on `06-telegram.spec.ts` having created that
link, but coverage shards do not guarantee that another spec ran against the same sandbox. Both attempts therefore
timed out on the same absent row. The coverage report failure is a consequence of this Playwright failure, not a
separate execution-coverage regression. The static job also reports only the unformatted selector introduced by the
previous repair.

The scenario now establishes its own precondition: it sends a bounded linking message, consumes the pairing code only
when the address is not already linked, and approves that exact address as the owner before testing the account chat.
It remains safe when a shared setup already linked the address. The selector is also formatted as required by Biome.
Product code, protocol behavior, account isolation, and message assertions are unchanged.

Docs impact: none — the repair removes cross-spec state from an internal E2E scenario and does not change an
owner-facing contract.
