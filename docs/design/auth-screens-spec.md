# Auth Screens Design Specification

**Project:** Ora AI App Store Polish  
**Task:** ORA-047  
**Date:** February 13, 2026  
**Designer:** Designer-Agent

---

## 🎨 Brand Integration

### Colors
- **Primary Brand:** `#1d473e` (Ora Forest Green) - CTAs, focus states
- **Secondary Accent:** `#D4B8E8` (Lavender) - Subtle highlights
- **Backgrounds:** `#FFFFFF` (White) with `#FAF8F3` (Warm cream) accents
- **Text Primary:** `#2D2D2D` (Charcoal)
- **Text Secondary:** `#5A5A5A` (Dark grey)
- **Error:** `#C87B7B` (Soft red)
- **Success:** `#2d5e52` (Primary green shade)
- **Border Default:** `#E0DCD3`
- **Border Focus:** `#1d473e`
- **Border Error:** `#C87B7B`

### Typography
- **Primary Font:** Sentient (Display, headings, body)
- **Secondary Font:** Switzer (UI elements, buttons)
- **Headings:** Sentient-Bold (700) or Medium (600)
- **Body Text:** Sentient-Regular (400)
- **Button Text:** Switzer-Semibold (600)
- **Input Labels:** Switzer-Medium (500)

### Spacing
- Screen padding: `24px` (xl)
- Form field spacing: `20px` (lg)
- Input padding: `16px` (md)
- Button height: `56px`
- Input height: `52px`

---

## 📱 Screen Designs

### 1. Sign Up Screen

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│           [Ora Logo]            │
│                                 │
│      Create Your Account        │ <- Hero (34px, Sentient-Bold)
│   Join the Ora AI community     │ <- Body (15px, Sentient-Regular)
│                                 │
│  ┌────────────────────────────┐ │
│  │ Full Name                  │ │ <- Label (13px, Switzer-Medium)
│  │ [Text Input]               │ │ <- Input (52px height)
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Email                      │ │
│  │ [Text Input]               │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Password                   │ │
│  │ [Text Input] [👁️]          │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Confirm Password           │ │
│  │ [Text Input] [👁️]          │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │      Sign Up               │ │ <- Primary Button (56px, #1d473e)
│  └────────────────────────────┘ │
│                                 │
│   Already have an account?     │
│         Sign In                │ <- Link (underlined, #1d473e)
│                                 │
└─────────────────────────────────┘
```

**Form Validation Rules:**
- **Full Name:** Required, min 2 characters, max 50
- **Email:** Required, valid email format
- **Password:** Required, min 8 characters, must include: 1 uppercase, 1 lowercase, 1 number
- **Confirm Password:** Must match password field

**Interaction States:**
- **Default:** Border `#E0DCD3`, background `#FAF8F3`
- **Focus:** Border `#1d473e` (2px), background `#FFFFFF`
- **Error:** Border `#C87B7B` (2px), error message below in `#C87B7B`
- **Success:** Border `#2d5e52` (2px), checkmark icon
- **Disabled:** Opacity 0.5, no interaction

**Error Messages:**
```
"Please enter your full name"
"Please enter a valid email address"
"Password must be at least 8 characters"
"Password must include uppercase, lowercase, and number"
"Passwords do not match"
```

---

### 2. Sign In Screen

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│           [Ora Logo]            │
│                                 │
│       Welcome Back              │ <- Hero (34px, Sentient-Bold)
│    Sign in to your account      │ <- Body (15px, Sentient-Regular)
│                                 │
│  ┌────────────────────────────┐ │
│  │ Email                      │ │
│  │ [Text Input]               │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Password                   │ │
│  │ [Text Input] [👁️]          │ │
│  └────────────────────────────┘ │
│                                 │
│              Forgot Password?   │ <- Link (13px, #1d473e)
│                                 │
│  ┌────────────────────────────┐ │
│  │      Sign In               │ │ <- Primary Button
│  └────────────────────────────┘ │
│                                 │
│   Don't have an account?       │
│      Create Account            │ <- Link
│                                 │
└─────────────────────────────────┘
```

**Form Validation Rules:**
- **Email:** Required, valid email format
- **Password:** Required, min 8 characters

**Error Handling:**
- Invalid credentials: "Email or password is incorrect"
- Network error: "Connection failed. Please try again."
- Account locked: "Account temporarily locked. Try again in 15 minutes."

---

### 3. Forgot Password Screen

**Layout:**
```
┌─────────────────────────────────┐
│                                 │
│         ← Back                  │ <- Back button (top-left)
│                                 │
│      Reset Password             │ <- Hero (34px, Sentient-Bold)
│  Enter your email to receive    │ <- Body (15px)
│   a password reset link         │
│                                 │
│  ┌────────────────────────────┐ │
│  │ Email                      │ │
│  │ [Text Input]               │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌────────────────────────────┐ │
│  │   Send Reset Link          │ │ <- Primary Button
│  └────────────────────────────┘ │
│                                 │
│         Back to Sign In         │ <- Link
│                                 │
└─────────────────────────────────┘
```

**Success State:**
```
┌─────────────────────────────────┐
│                                 │
│            ✅                   │
│                                 │
│      Check Your Email           │
│                                 │
│  We've sent a password reset   │
│  link to example@email.com     │
│                                 │
│  ┌────────────────────────────┐ │
│  │   Return to Sign In        │ │
│  └────────────────────────────┘ │
│                                 │
│  Didn't receive the email?     │
│        Resend Link             │ <- Link
│                                 │
└─────────────────────────────────┘
```

---

## 🎯 Component Specifications

### Input Field Component

**Anatomy:**
```typescript
<FormInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  placeholder="you@example.com"
  error={errors.email}
  keyboardType="email-address"
  autoCapitalize="none"
  returnKeyType="next"
  onSubmitEditing={focusNextInput}
/>
```

**Styles:**
- Label: 13px, Switzer-Medium, #5A5A5A, margin-bottom 8px
- Input Container: 52px height, border-radius 12px, padding 16px
- Input Text: 15px, Sentient-Regular, #2D2D2D
- Placeholder: #8A8A8A
- Error Text: 12px, Switzer-Regular, #C87B7B, margin-top 6px

**Password Field:**
- Toggle visibility icon (eye/eye-slash) at right edge
- Icon color: #757575 (default), #1d473e (active)

### Button Component

**Primary Button:**
- Height: 56px
- Border radius: 12px
- Background: #1d473e (default), #0f2a24 (pressed)
- Text: 17px, Switzer-Semibold, #FFFFFF
- Shadow: elevation 2, subtle shadow

**Secondary Button (outline):**
- Background: transparent
- Border: 2px solid #1d473e
- Text: #1d473e

**Loading State:**
- Show ActivityIndicator in button
- Disable interaction
- Reduce opacity to 0.7

### Link Component

**Styles:**
- Font: 15px, Switzer-Medium
- Color: #1d473e
- Text decoration: underline
- Active opacity: 0.7

---

## ⌨️ Keyboard Handling

**Behavior:**
1. Screen content scrollable when keyboard appears
2. Active input field automatically scrolls into view
3. "Return" key behavior:
   - On all inputs except last: Move to next field
   - On last input: Submit form
4. Keyboard dismiss: Tap outside input or swipe down

**iOS-specific:**
- Use `KeyboardAvoidingView` with `behavior="padding"`
- Respect safe area insets

**Android-specific:**
- Use `android:windowSoftInputMode="adjustResize"` in manifest

---

## 🔐 Security Considerations

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Optional: Special character for stronger security

**Password Visibility:**
- Default: Obscured
- Toggle button to show/hide
- Re-obscure after 30 seconds of inactivity (optional)

**Form Security:**
- Never store passwords in plain text state
- Clear password fields on unmount
- Validate on both client and server
- Implement rate limiting for sign-in attempts

---

## 📊 Loading States

**During API Calls:**
1. Show loading spinner in button
2. Disable all form inputs
3. Disable back navigation
4. Optional: Show loading overlay for full-screen block

**Success:**
1. Show success message briefly (2 seconds)
2. Navigate to next screen
3. Optional: Haptic feedback (light impact)

**Error:**
1. Show error message below button or in alert
2. Keep form inputs intact
3. Focus relevant field if field-specific error
4. Shake animation for button (optional)

---

## ♿️ Accessibility

**Labels:**
- All inputs have accessible labels
- Use `accessibilityLabel` for icons
- Password toggle: "Show password" / "Hide password"

**Focus Management:**
- Logical tab order through form fields
- Ensure all interactive elements are keyboard-accessible

**Screen Reader:**
- Announce form validation errors
- Announce loading states
- Announce successful submissions

**Color Contrast:**
- All text meets WCAG AA standards (4.5:1 minimum)
- Error messages: high contrast against background

---

## 🧪 Edge Cases

**Network Issues:**
- Timeout after 30 seconds
- Show retry option
- Offline detection: "You appear to be offline"

**Validation Timing:**
- **On blur:** Validate field when user leaves it
- **On submit:** Validate entire form
- **Real-time:** For password strength indicator (optional)

**Email Edge Cases:**
- Trim whitespace before validation
- Convert to lowercase before submission
- Handle international characters (UTF-8)

**Password Edge Cases:**
- Paste functionality enabled
- No max length restriction (allow passphrases)
- Handle special characters properly

---

## 🎨 Visual Polish

**Animations:**
- Input focus: Smooth border color transition (200ms)
- Button press: Scale down slightly (0.98)
- Error shake: Horizontal translation animation
- Success checkmark: Scale-in animation with spring

**Micro-interactions:**
- Haptic feedback on button press (iOS)
- Smooth keyboard appearance
- Loading spinner fades in/out

**Empty States:**
- Placeholder text guides user
- Auto-focus first input on screen mount

---

## 📐 Dimensions Reference

| Element | Height | Padding | Border Radius |
|---------|--------|---------|---------------|
| Input Field | 52px | 16px horizontal, 16px vertical | 12px |
| Button | 56px | - | 12px |
| Logo | 80px | - | - |
| Screen Padding | - | 24px all sides | - |
| Field Spacing | - | 20px vertical gap | - |
| Label Margin | - | 8px bottom | - |
| Error Text Margin | - | 6px top | - |

---

## 📱 Responsive Behavior

**Small Screens (<375px width):**
- Reduce screen padding to 16px
- Reduce logo size to 60px
- Maintain button and input heights

**Large Screens (>768px width - tablets):**
- Center form in 400px max-width container
- Increase screen padding to 40px
- Maintain touch target sizes

**Landscape Mode:**
- Reduce vertical spacing
- Reduce logo size
- Prioritize keyboard space

---

## ✅ Implementation Checklist

- [ ] Sign Up Screen component
- [ ] Sign In Screen component
- [ ] Forgot Password Screen component
- [ ] FormInput component with validation
- [ ] PrimaryButton component with loading state
- [ ] Password toggle visibility
- [ ] Form validation logic
- [ ] Error message display
- [ ] Keyboard handling (KeyboardAvoidingView)
- [ ] Navigation integration
- [ ] API integration hooks
- [ ] Loading states
- [ ] Success states
- [ ] Error states
- [ ] Accessibility labels
- [ ] Responsive design
- [ ] Animation polish

---

**End of Specification**
