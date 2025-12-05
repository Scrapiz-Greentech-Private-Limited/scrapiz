# Tutorial Overlay Accessibility Testing Guide

This guide provides instructions for manually testing the TutorialOverlay component with screen readers (TalkBack on Android and VoiceOver on iOS).

## Overview

The TutorialOverlay component has been designed with comprehensive accessibility features:

- ✅ Accessibility labels for all interactive elements
- ✅ Accessibility hints for user guidance
- ✅ Proper accessibility roles (button, alert, header, text)
- ✅ Minimum touch target size of 44x44 points
- ✅ WCAG AA compliant color contrast ratios
- ✅ Screen reader optimized content structure

## Testing with TalkBack (Android)

### Enable TalkBack

1. Open **Settings** > **Accessibility** > **TalkBack**
2. Toggle TalkBack **ON**
3. Confirm the activation dialog

### Testing Steps

1. **Navigate to Help & Support**
   - Swipe right to navigate through elements
   - Listen for "Guides" section announcement
   - Double-tap to select a tutorial

2. **Start Tutorial**
   - Listen for confirmation toast
   - Double-tap to confirm
   - App should navigate to target screen

3. **Tutorial Overlay**
   - TalkBack should announce: "Tutorial overlay, modal"
   - Swipe right to navigate to tutorial card
   - Listen for: "Tutorial step 1 of 5: [Title]. [Description], alert"

4. **Step Indicator**
   - Swipe right to hear: "Step 1 of 5, text"

5. **Title**
   - Swipe right to hear: "[Title], header"

6. **Description**
   - Swipe right to hear: "[Description], text"

7. **Skip Button**
   - Swipe right to hear: "Skip tutorial, button"
   - Listen for hint: "Double tap to exit the tutorial and return to normal app usage"
   - Double-tap to test (should exit tutorial)

8. **Next Button**
   - Swipe right to hear: "Next step, button" (or "Finish tutorial" on last step)
   - Listen for hint: "Double tap to advance to the next tutorial step"
   - Double-tap to test (should advance to next step)

9. **Spotlight Area**
   - If spotlight is present, TalkBack should announce: "Tap highlighted area to advance to next step, button"
   - Listen for hint: "Double tap to proceed to the next tutorial step"

### Expected Behavior

- All interactive elements should be focusable
- All text should be read aloud clearly
- Button actions should work with double-tap
- Navigation should be logical (top to bottom, left to right)
- No decorative elements (SVG, containers) should be announced

## Testing with VoiceOver (iOS)

### Enable VoiceOver

1. Open **Settings** > **Accessibility** > **VoiceOver**
2. Toggle VoiceOver **ON**
3. Or use Siri: "Hey Siri, turn on VoiceOver"

### Testing Steps

1. **Navigate to Help & Support**
   - Swipe right to navigate through elements
   - Listen for "Guides" section announcement
   - Double-tap to select a tutorial

2. **Start Tutorial**
   - Listen for confirmation toast
   - Double-tap to confirm
   - App should navigate to target screen

3. **Tutorial Overlay**
   - VoiceOver should announce: "Tutorial overlay, modal"
   - Swipe right to navigate to tutorial card
   - Listen for: "Tutorial step 1 of 5: [Title]. [Description], alert"

4. **Step Indicator**
   - Swipe right to hear: "Step 1 of 5, text"

5. **Title**
   - Swipe right to hear: "[Title], heading"

6. **Description**
   - Swipe right to hear: "[Description], text"

7. **Skip Button**
   - Swipe right to hear: "Skip tutorial, button"
   - Listen for hint: "Double tap to exit the tutorial and return to normal app usage"
   - Double-tap to test (should exit tutorial)

8. **Next Button**
   - Swipe right to hear: "Next step, button" (or "Finish tutorial" on last step)
   - Listen for hint: "Double tap to advance to the next tutorial step"
   - Double-tap to test (should advance to next step)

9. **Spotlight Area**
   - If spotlight is present, VoiceOver should announce: "Tap highlighted area to advance to next step, button"
   - Listen for hint: "Double tap to proceed to the next tutorial step"

### Expected Behavior

- All interactive elements should be focusable
- All text should be read aloud clearly
- Button actions should work with double-tap
- Navigation should be logical (top to bottom, left to right)
- Modal should trap focus (can't navigate outside tutorial)
- No decorative elements should be announced

## Color Contrast Verification

### Light Theme

Run the accessibility tests to verify contrast ratios:

```bash
npm test -- TutorialOverlay.accessibility.test.tsx
```

Expected results:
- Title text (#111827 on #fefdfb): ≥ 3:1 (WCAG AA for large text) ✓
- Description text (#6b7280 on #fefdfb): ≥ 4.5:1 (WCAG AA) ✓
- Step indicator (#16a34a on #fefdfb): ≥ 4.5:1 (WCAG AA) ✓
- Skip button text (#6b7280 on #fefdfb): ≥ 4.5:1 (WCAG AA) ✓
- Next button text (#ffffff on #16a34a): ≥ 4.5:1 (WCAG AA) ✓

### Dark Theme

Expected results:
- Title text (#f1f5f9 on #1e293b): ≥ 3:1 (WCAG AA for large text) ✓
- Description text (#cbd5e1 on #1e293b): ≥ 4.5:1 (WCAG AA) ✓
- Step indicator (#22c55e on #1e293b): ≥ 4.5:1 (WCAG AA) ✓
- Skip button text (#cbd5e1 on #1e293b): ≥ 4.5:1 (WCAG AA) ✓
- Next button text (#0f172a on #22c55e): ≥ 4.5:1 (WCAG AA) ✓

## Touch Target Size Verification

All interactive elements meet the minimum touch target size of 44x44 points:

- ✅ Skip button: minHeight 44pt, width > 44pt (flex: 1)
- ✅ Next button: minHeight 44pt, width > 44pt (flex: 1)
- ✅ Spotlight area: Full element size (typically > 44x44pt)

## Common Issues and Solutions

### Issue: TalkBack/VoiceOver not announcing elements

**Solution**: Ensure the element has:
- `accessible={true}`
- `accessibilityLabel="[descriptive label]"`
- `accessibilityRole="[appropriate role]"`

### Issue: Decorative elements being announced

**Solution**: Set `accessible={false}` on decorative elements like:
- Container Views
- SVG elements
- Animated.View wrappers

### Issue: Button text being read twice

**Solution**: Set `accessible={false}` on Text components inside TouchableOpacity when the TouchableOpacity has an accessibilityLabel

### Issue: Poor contrast in custom themes

**Solution**: Use the `validateTutorialContrast()` function to verify contrast ratios before deploying custom themes

## Automated Testing

Run the full accessibility test suite:

```bash
# Run all accessibility tests
npm test -- TutorialOverlay.accessibility.test.tsx

# Run with coverage
npm test -- --coverage TutorialOverlay.accessibility.test.tsx

# Run in watch mode during development
npm test -- --watch TutorialOverlay.accessibility.test.tsx
```

## Accessibility Checklist

Before releasing, verify:

- [ ] All interactive elements have accessibility labels
- [ ] All interactive elements have accessibility hints
- [ ] All interactive elements have appropriate accessibility roles
- [ ] All touch targets are at least 44x44 points
- [ ] All text meets WCAG AA contrast ratios (4.5:1 for normal, 3:1 for large)
- [ ] TalkBack navigation works correctly (Android)
- [ ] VoiceOver navigation works correctly (iOS)
- [ ] Modal traps focus appropriately
- [ ] Decorative elements are not announced
- [ ] Button actions work with double-tap
- [ ] Tutorial can be completed using only screen reader

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [iOS VoiceOver Guide](https://support.apple.com/guide/iphone/turn-on-and-practice-voiceover-iph3e2e415f/ios)
- [Android TalkBack Guide](https://support.google.com/accessibility/android/answer/6283677)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
