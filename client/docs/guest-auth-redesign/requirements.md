# Guest-Accessible Authentication Redesign

## Document Information

- **Version**: 1.0.0
- **Created**: 2026-02-02
- **Last Updated**: 2026-02-02
- **Status**: Planning

---

## 1. Executive Summary

### 1.1 Overview

Redesign the Scrapiz mobile application's authentication flow to allow unauthenticated users (guests) to browse the app freely while requiring authentication only for transactional operations. This approach improves user acquisition, reduces friction, and follows modern app design patterns used by leading e-commerce platforms.

### 1.2 Business Goals

- **Reduce drop-off rate**: Allow users to explore before committing to sign-up
- **Improve conversion**: Let users see value proposition (rates, services) before registration
- **Enhance user experience**: Remove unnecessary auth barriers for informational content
- **Maintain security**: Protect transactional and personal data with contextual auth gates

### 1.3 Current State

- Users are **blocked at login screen** if not authenticated
- Cannot access Home, Rates, or any tabs without signing in
- First-time users have no way to preview the app's value

### 1.4 Target State

- Guests can browse Home, Rates, and Services freely
- Guests can start the Sell flow (item selection, scheduling)
- Authentication is triggered **contextually** when:
  - Confirming an order (Sell Step 3)
  - Accessing Profile data
  - Any action requiring user identity

---

## 2. User Stories

### 2.1 Epic: Guest Browsing Experience

#### US-001: Guest Home Access

**As a** guest user  
**I want to** access the home screen without logging in  
**So that** I can explore the app and understand its value proposition

**Acceptance Criteria:**

- [ ] App launches directly to home screen (not login)
- [ ] All home screen content loads (carousel, quick actions, services, rates preview)
- [ ] Profile icon shows generic user avatar
- [ ] Tapping profile icon leads to guest profile view
- [ ] Environmental impact section hidden for guests (no order history)

**Priority**: P0 (Critical)  
**Story Points**: 3

---

#### US-002: Guest Rates Viewing

**As a** guest user  
**I want to** view current scrap rates without logging in  
**So that** I can check if the prices are competitive before signing up

**Acceptance Criteria:**

- [ ] Rates screen loads full category/product data
- [ ] All images, prices, and descriptions display correctly
- [ ] Pull-to-refresh works for guests
- [ ] "Schedule Pickup" button navigates to Sell screen
- [ ] No auth prompts appear while browsing rates

**Priority**: P0 (Critical)  
**Story Points**: 2

---

#### US-003: Guest Services Browsing

**As a** guest user  
**I want to** browse available services (demolition, dismantling, etc.)  
**So that** I can understand the full range of offerings

**Acceptance Criteria:**

- [ ] Services tab accessible to guests
- [ ] Service details pages load without auth
- [ ] Contact/inquiry actions may prompt for auth (future consideration)

**Priority**: P1 (High)  
**Story Points**: 2

---

### 2.2 Epic: Guest Sell Flow (Partial Access)

#### US-004: Guest Item Selection (Sell Step 1)

**As a** guest user  
**I want to** select items I want to sell and specify quantities  
**So that** I can see estimated value before signing up

**Acceptance Criteria:**

- [ ] Sell screen Step 1 accessible without auth
- [ ] Products and categories load from API
- [ ] Item selection and quantity adjustment works
- [ ] Estimated value calculation displays correctly
- [ ] "Next" button progresses to Step 2

**Priority**: P0 (Critical)  
**Story Points**: 3

---

#### US-005: Guest Schedule Selection (Sell Step 2)

**As a** guest user  
**I want to** select a pickup date and time  
**So that** I can plan my schedule before committing

**Acceptance Criteria:**

- [ ] Date picker accessible to guests
- [ ] Time slot selection works
- [ ] Selected schedule displays correctly
- [ ] "Next" button triggers auth check before Step 3

**Priority**: P0 (Critical)  
**Story Points**: 2

---

#### US-006: Auth Gate at Order Confirmation (Sell Step 3)

**As a** guest user attempting to confirm an order  
**I want to** be prompted to sign in or register  
**So that** I can complete my order securely

**Acceptance Criteria:**

- [ ] Attempting to proceed to Step 3 triggers auth modal/redirect
- [ ] Order data (items, quantities, schedule) is preserved
- [ ] After successful auth, user returns to Sell Step 3
- [ ] All previously selected data is restored
- [ ] User can then enter address and confirm order

**Priority**: P0 (Critical)  
**Story Points**: 5

---

#### US-007: Order Data Persistence Across Auth

**As a** user who just logged in from Sell flow  
**I want** my selected items and schedule to be restored  
**So that** I don't have to re-enter everything

**Acceptance Criteria:**

- [ ] Order state stored in persistent storage (AsyncStorage) before auth redirect
- [ ] State includes: items, quantities, selected date, selected time
- [ ] After auth success, state is read and restored
- [ ] Zustand store is hydrated with saved data
- [ ] User sees Step 3 with all previous selections intact

**Priority**: P0 (Critical)  
**Story Points**: 5

---

### 2.3 Epic: Guest Profile Experience

#### US-008: Guest Profile View

**As a** guest user  
**I want to** see a placeholder profile screen  
**So that** I understand I need to sign in for personalized features

**Acceptance Criteria:**

- [ ] Profile tab shows "Guest Mode" indicator
- [ ] Generic avatar displayed
- [ ] Clear CTA button: "Sign In to Access Your Profile"
- [ ] Brief list of benefits shown (order history, rewards, etc.)
- [ ] Sign in button navigates to login screen

**Priority**: P0 (Critical)  
**Story Points**: 3

---

#### US-009: Auth Prompt on Protected Actions

**As a** guest user  
**I want to** see a clear sign-in prompt when accessing protected features  
**So that** I understand why authentication is needed

**Acceptance Criteria:**

- [ ] Consistent auth prompt modal used across app
- [ ] Modal explains why sign-in is needed
- [ ] "Sign In" and "Register" buttons provided
- [ ] "Cancel" returns user to previous screen
- [ ] Accessible, follows design system

**Priority**: P1 (High)  
**Story Points**: 3

---

### 2.4 Epic: Authentication Flow Updates

#### US-010: Contextual Login with Return URL

**As a** user redirected to login from a protected action  
**I want to** return to my previous location after signing in  
**So that** I can complete my intended action seamlessly

**Acceptance Criteria:**

- [ ] Login screen accepts `returnTo` parameter
- [ ] After successful login, user navigates to `returnTo` path
- [ ] If no `returnTo`, defaults to home screen
- [ ] Works for both login and registration flows
- [ ] Deep link params preserved in navigation

**Priority**: P0 (Critical)  
**Story Points**: 4

---

#### US-011: Hide Auth Screens from Guest Navigation

**As a** guest user  
**I want** the login/register screens to only appear when contextually needed  
**So that** I'm not blocked from exploring the app

**Acceptance Criteria:**

- [ ] App entry point is `/(tabs)/home`, not `/(auth)/login`
- [ ] Auth screens are modals or separate stack, not tab destinations
- [ ] Language selection still shown on first launch (if applicable)
- [ ] Auth screens accessible via manual navigation or triggered actions

**Priority**: P0 (Critical)  
**Story Points**: 3

---

### 2.5 Epic: Navigation & State Management

#### US-012: Guest-Aware Navigation Guards

**As a** developer  
**I want** a reusable auth guard utility  
**So that** I can consistently protect actions across the app

**Acceptance Criteria:**

- [ ] `useAuthGuard` hook or utility created
- [ ] Accepts action callback and optional return path
- [ ] If authenticated: executes action immediately
- [ ] If guest: shows auth prompt, stores return intent
- [ ] Integrates with existing AuthContext

**Priority**: P1 (High)  
**Story Points**: 4

---

#### US-013: Guest State Detection

**As a** developer  
**I want** a reliable way to check if user is a guest  
**So that** I can conditionally render UI appropriately

**Acceptance Criteria:**

- [ ] `isGuest` boolean exposed from AuthContext
- [ ] `isGuest = !isAuthenticated && !isLoading`
- [ ] Components can use this for conditional rendering
- [ ] TypeScript types updated to include guest state

**Priority**: P0 (Critical)  
**Story Points**: 2

---

## 3. Non-Functional Requirements

### 3.1 Performance

- **NFR-001**: Guest mode startup time should be ≤ current auth flow time
- **NFR-002**: Order state persistence/restoration should complete in < 500ms
- **NFR-003**: Auth prompt modal should appear in < 100ms

### 3.2 Security

- **NFR-004**: No sensitive user data exposed to guests
- **NFR-005**: Order creation API must require valid auth token
- **NFR-006**: Stored guest order data must not persist beyond 24 hours

### 3.3 Accessibility

- **NFR-007**: Auth prompt modal must be screen-reader accessible
- **NFR-008**: Guest profile CTA must meet WCAG 2.1 AA contrast requirements

### 3.4 Maintainability

- **NFR-009**: Auth guard logic centralized in single utility
- **NFR-010**: Guest vs authenticated UI variations documented in component docstrings

---

## 4. Technical Constraints

### 4.1 Must Use

- Existing Zustand store (`orderCalculationStore`) for Sell flow state
- Existing AuthContext for auth state management
- Expo Router for navigation with return URL handling
- AsyncStorage for guest order persistence

### 4.2 Must Not

- Break existing authenticated user flows
- Require backend API changes (all changes client-side)
- Remove existing auth screens (just change when they appear)

---

## 5. Out of Scope (v1.0)

The following are explicitly **NOT** in scope for this implementation:

- [ ] Guest wishlist/favorites
- [ ] Guest order history preview (mocked data)
- [ ] Anonymous order submission (always require auth for orders)
- [ ] Social sharing for guests
- [ ] Push notification permission for guests
- [ ] Guest referral code entry

---

## 6. Success Metrics

| Metric                               | Current | Target           | Measurement Method    |
| ------------------------------------ | ------- | ---------------- | --------------------- |
| First-time user drop-off at login    | Unknown | -30%             | Analytics funnel      |
| Time to first "Sell" action          | N/A     | Baseline         | Session recording     |
| Conversion rate (guest → registered) | N/A     | Track            | Authentication events |
| App store rating impact              | 4.x     | Maintain/Improve | Store reviews         |

---

## 7. Appendix

### 7.1 Glossary

- **Guest**: Unauthenticated user browsing the app
- **Auth Gate**: Point in user journey where authentication is required
- **Contextual Auth**: Authentication triggered by specific actions, not app entry
- **Return URL**: Path to navigate to after successful authentication

### 7.2 Related Documents

- [Implementation Plan](./implementation-plan.md)
- [Component Specifications](./components/) (to be created)
- [Test Cases](./test-cases.md) (to be created)

### 7.3 Revision History

| Version | Date       | Author       | Changes       |
| ------- | ---------- | ------------ | ------------- |
| 1.0.0   | 2026-02-02 | AI Assistant | Initial draft |
