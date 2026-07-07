# TEST_RESULTS.md — End-to-End Live Verification

> **Instructions:** Run through each test case on the **live deployed URLs** (not localhost).
> Mark each as ✅ Pass, ❌ Fail, or ⏭️ Skipped with a brief note.
>
> Fill in the URLs below after deployment:

**Frontend URL:** `___________________________`
**Backend URL:**  `___________________________`

---

## User Flow

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 1 | Register a new account | Go to /register → fill username, email, password, confirm password → Submit | Redirected to /payments, user logged in | | |
| 2 | Log in | Log out → Go to /login → enter email + password → Submit | Redirected to /payments, user logged in | | |
| 3 | Add Bank payment | Click "+ Add" → select Bank → fill all 5 fields → Save | Card appears in list with Bank badge | | |
| 4 | Add Paytm payment | Click "+ Add" → select Paytm → fill paytmNumber → Save | Card appears with Paytm badge | | |
| 5 | Add UPI payment | Click "+ Add" → select UPI → fill upiId → Save | Card appears with UPI badge | | |
| 6 | Add PayPal payment | Click "+ Add" → select PayPal → fill paypalEmail → Save | Card appears with PayPal badge | | |
| 7 | Add USDT payment | Click "+ Add" → select USDT → fill usdtAddress → Save | Card appears with USDT badge | | |
| 8 | All 5 show correctly | Visual check | All 5 cards visible, each with correct type label and detail | | |
| 9 | Edit an entry | Click ✏️ on one card → change a field → Save → Refresh page | Change persisted after refresh | | |
| 10 | Delete an entry | Click 🗑️ on one card → Confirm → Refresh page | Card gone after refresh | | |
| 11 | Log out | Click Logout in navbar | Redirected to /login, /payments no longer accessible | | |
| 12 | Protected routes blocked | While logged out, navigate to /payments directly | Redirected to /login | | |

---

## Admin Flow

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 13 | Login as admin | Log in with admin account | Navbar shows "Admin" link | | |
| 14 | Admin sees all users' payments | Go to /admin → click Search with no filters | Table shows entries from multiple users | | |
| 15 | Filter by paymentType | Select "Bank" in dropdown → Search | Only Bank entries shown | | |
| 16 | Filter by username | Type a username → Search | Only that user's entries shown | | |
| 17 | Filter by bankName | Type a bank name → Search | Only matching Bank entries shown | | |
| 18 | Non-admin blocked from /admin | Log in as regular user → navigate to /admin | Redirected away / access denied | | |
| 19 | Non-admin blocked from API | Call GET /api/admin/payments with regular user's JWT | 403 Forbidden response | | |

---

## Infrastructure

| # | Test Case | Steps | Expected Result | Status | Notes |
|---|-----------|-------|----------------|--------|-------|
| 20 | Backend health check | Visit `<backend-url>/api/health` | Returns `{ "status": "ok" }` | | |
| 21 | Hard refresh on /payments | While logged in, press F5 on /payments | Page reloads correctly (no 404) | | |
| 22 | Backend unreachable message | Stop backend → try to login on frontend | "Cannot reach the server" message shown | | |
| 23 | Toast notifications | Add a payment method | Green "Payment method added!" toast appears | | |

---

## Summary

| Category | Total | Pass | Fail | Skipped |
|----------|:-----:|:----:|:----:|:-------:|
| User Flow | 12 | | | |
| Admin Flow | 7 | | | |
| Infrastructure | 4 | | | |
| **TOTAL** | **23** | | | |

**Overall Result:** _______________

**Tested by:** _______________
**Date:** _______________
