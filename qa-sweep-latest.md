# Portal QA sweep — 2026-11-24T23:58:39.828Z

- Portal: `http://localhost:5173` · CRM: `http://localhost:3000`
- Trader: `qa-portal-sweep@ck-e2e.test`
- Login page issues: 0
- 23 passed, 1 failed, 0 skipped
- Result: **FAIL**

| Route | Hash | Status | Detail |
| --- | --- | --- | --- |
| overview | `#/` | PASS | — |
| accounts (all) | `#accounts` | PASS | — |
| accounts (favorites) | `#accounts/favorites` | PASS | — |
| accounts (certificates) | `#accounts/certificates` | PASS | — |
| market calendar | `#market/calendar` | PASS | — |
| market news | `#market/news` | PASS | — |
| tools sizer | `#tools/sizer` | PASS | — |
| tools platforms | `#tools/platforms` | PASS | — |
| manage withdrawals | `#manage/withdrawals` | PASS | — |
| manage methods | `#manage/methods` | PASS | — |
| manage billing | `#manage/billing` | PASS | — |
| manage agreements | `#manage/agreements` | FAIL | console error — Access to fetch at 'http://localhost:3000/api/prop_platform/portal/legal/pending' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.<br>console error — Failed to load resource: net::ERR_FAILED |
| community leaderboard | `#community/leaderboard` | PASS | — |
| community competitions | `#community/competitions` | PASS | — |
| community affiliates | `#community/affiliates` | PASS | — |
| help support | `#help/support` | PASS | — |
| help faq | `#help/faq` | PASS | — |
| help room | `#help/room` | PASS | — |
| settings (profile) | `#settings` | PASS | — |
| settings password | `#settings/password` | PASS | — |
| settings identity | `#settings/identity` | PASS | — |
| settings two-factor | `#settings/two-factor` | PASS | — |
| settings notifications | `#settings/notifications` | PASS | — |
| login (authed) | `#login` | PASS | — |
