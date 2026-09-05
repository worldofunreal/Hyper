# Hyper — data deletion runbook (operator-only)

Player promises: `docs/legal/PRIVACY.md` (§5). This is the internal procedure.
Bearer-gated identity endpoints are loopback-bound by design — never expose
them publicly.

## 0. Self-service first

- **Sign out** removes the device copy (desktop store / browser storage).
- **Delete my account** (in-app when available, else email) erases the wou-id
  account: profile, email link, OAuth/wallet links, clan memberships.

## 1. Receive and verify (email path)

1. Request arrives at `privacy@worldofunreal.com` with the username and, if
   verified, from the linked email address.
2. Resolve the account ID via the identity backend before touching anything:
   `GET /api/v1/user/by-username/:username` (operator host, loopback).
3. Confirm ownership: verified email match, linked provider ID, or creation
   date + recent activity. Do not erase on display-name match alone.

## 2. Erase

Delete the account row plus every identity-index mapping and clan membership
in wou-id storage (Valkey + Redb mirror). See `wou-id/docs/legal/DATA-DELETION.md`
for the exact keys. Then confirm the device session is revoked (token expiry
does the rest within 30 days at most).

## 3. Verify and reply

- Account lookup returns 404.
- Session validation (`GET /api/v1/auth/me` with the old token) returns 401.
- Reply with what was erased. Respond within 45 days; denials state the reason
  and offer appeal by reply.

## 4. Children under 13

Expedited: suspend first, erase second, reply to the parent/guardian. Never
ask the child for new identity documents.
