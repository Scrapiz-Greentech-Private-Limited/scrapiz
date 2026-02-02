# Guest-Accessible Authentication Redesign

> 🔓 **Allow users to browse freely, authenticate only when needed**

## Project Overview

This project redesigns the Scrapiz mobile app authentication flow to follow modern e-commerce patterns, allowing guests to explore the app's value proposition before requiring sign-in.

## Documentation Structure

```
docs/guest-auth-redesign/
├── README.md                 # This file - Quick overview
├── requirements.md           # User stories & acceptance criteria
├── implementation-plan.md    # Technical implementation details
└── progress-tracker.md       # Task completion tracking
```

## Quick Summary

### What's Changing?

| Before                        | After                              |
| ----------------------------- | ---------------------------------- |
| Login screen blocks app entry | Home screen is the entry point     |
| Can't see rates without auth  | Rates fully visible to guests      |
| Can't start sell flow         | Can browse & select items as guest |
| Profile requires login        | Guest profile with sign-in prompt  |

### User Journey Comparison

```
BEFORE:
App Launch → Login Required → Home → Features

AFTER:
App Launch → Home (Guest) → Browse Freely → [Auth Gate at Order] → Login → Complete Order
```

## Key Files to Modify

### Priority 1 (Core Changes)

- [ ] `src/app/index.tsx` - Remove auth gate
- [ ] `src/context/AuthContext.tsx` - Add guest state
- [ ] `src/app/(tabs)/sell.tsx` - Auth gate at Step 3
- [ ] `src/app/(auth)/login.tsx` - Handle return URL

### Priority 2 (Supporting Features)

- [ ] `src/hooks/useAuthGuard.ts` - New file
- [ ] `src/utils/guestOrderPersistence.ts` - New file
- [ ] `src/components/GuestProfileView.tsx` - New file
- [ ] `src/app/(tabs)/profile.tsx` - Show guest view

## Estimated Timeline

| Phase   | Tasks               | Duration |
| ------- | ------------------- | -------- |
| Phase 1 | Core Infrastructure | Day 1    |
| Phase 2 | Navigation Updates  | Day 1-2  |
| Phase 3 | Sell Flow Auth Gate | Day 2    |
| Phase 4 | Guest Profile UI    | Day 3    |
| Phase 5 | Testing & Polish    | Day 3-4  |

**Total: 3-4 days**

## Success Criteria

- [ ] Guest can browse home without login
- [ ] Guest can view all scrap rates
- [ ] Guest can complete Sell Steps 1-2
- [ ] Auth triggered at Step 3 confirmation
- [ ] Order data preserved through auth flow
- [ ] Guest profile shows sign-in benefits
- [ ] No regression in existing auth flows

## Getting Started

1. **Read the requirements**: [`requirements.md`](./requirements.md)
2. **Follow the plan**: [`implementation-plan.md`](./implementation-plan.md)
3. **Track progress**: [`progress-tracker.md`](./progress-tracker.md)

## Questions?

Refer to the detailed implementation plan for code examples and architecture diagrams.
