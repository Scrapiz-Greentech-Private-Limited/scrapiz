# Profile Tutorial Integration Test

## Test Steps

### 1. Start Tutorial from Help & Support
1. Navigate to Profile tab
2. Tap on "Help & Support"
3. Scroll to "Guides" section
4. Tap on "Profile Screen Tutorial"
5. Confirm "Start" in the alert dialog

**Expected Result:**
- Alert shows: "Would you like to start the Profile Screen Tutorial?"
- After confirming, navigate to Profile screen
- Tutorial overlay appears

### 2. Tutorial Step 1 - Profile Header
**Expected Result:**
- Spotlight highlights the profile header (avatar, name, email)
- Tutorial card shows:
  - Title: "Profile Header"
  - Description: "View and edit your profile information, including your name, photo, and contact details."
  - Step indicator: "1/5"
  - "Next" and "Skip Tutorial" buttons

### 3. Tutorial Step 2 - Account Settings
**Action:** Tap "Next" button

**Expected Result:**
- Spotlight moves to the "Preferences" section (Notifications, Language Support)
- Tutorial card shows:
  - Title: "Account Settings"
  - Description: "Manage your account preferences, notifications, language, and privacy settings."
  - Step indicator: "2/5"

### 4. Tutorial Step 3 - Orders Section
**Action:** Tap "Next" button

**Expected Result:**
- Spotlight moves to the "Orders & Services" section (My Orders)
- Tutorial card shows:
  - Title: "Orders Section"
  - Description: "View your order history, track active pickups, and review past transactions."
  - Step indicator: "3/5"

### 5. Tutorial Step 4 - Referral Wallet
**Action:** Tap "Next" button

**Expected Result:**
- Spotlight moves to the "Support & Feedback" section (Help & Support, Refer Friends)
- Tutorial card shows:
  - Title: "Referral Wallet"
  - Description: "Earn rewards by referring friends! Track your referral earnings and redeem them here."
  - Step indicator: "4/5"

### 6. Tutorial Step 5 - Environmental Impact
**Action:** Tap "Next" button

**Expected Result:**
- Spotlight moves to the "Environmental Impact" section
- Tutorial card shows:
  - Title: "Environmental Impact"
  - Description: "See the positive environmental impact you've made through recycling and scrap collection."
  - Step indicator: "5/5"

### 7. Complete Tutorial
**Action:** Tap "Next" button

**Expected Result:**
- Tutorial overlay disappears
- Tutorial is marked as complete
- Return to Help & Support screen shows checkmark next to "Profile Screen Tutorial"

### 8. Skip Tutorial Test
**Action:** Start tutorial again and tap "Skip Tutorial" at any step

**Expected Result:**
- Tutorial overlay disappears immediately
- Tutorial is NOT marked as complete
- Can restart tutorial from Help & Support

## Integration Verification

### Code Verification
- [x] profileTutorialConfig created in `client/src/config/tutorials/profileTutorial.ts`
- [x] Tutorial config exported from index
- [x] TutorialOverlay imported in Profile screen
- [x] useTutorialStore imported in Profile screen
- [x] Refs created for all 5 UI elements
- [x] useEffect measures element positions when tutorial is active
- [x] TutorialOverlay component rendered at end of ScrollView

### UI Element Refs
- [x] profileHeaderRef - Profile header with avatar
- [x] settingsRef - Preferences section
- [x] ordersRef - Orders & Services section
- [x] referralRef - Support & Feedback section
- [x] impactRef - Environmental Impact section

## Requirements Validation

### Requirement 8.1
✅ Profile header step highlights the profile header with avatar

### Requirement 8.2
✅ Settings step explains account settings section

### Requirement 8.3
✅ Orders step highlights the orders section

### Requirement 8.4
✅ Referral step explains the referral wallet

### Requirement 8.5
✅ Impact step highlights environmental impact section

### Requirement 11.2
✅ Steps are displayed in the order specified in profileTutorialConfig

### Requirement 11.3
✅ Tutorial configuration is independent and doesn't affect other screens
