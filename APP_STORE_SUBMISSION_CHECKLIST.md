# Ora AI - App Store Submission Checklist

## Pre-Submission Checklist

Complete this checklist before submitting to App Store Connect.

---

### ✅ 1. App Icon

**Requirements:**
- [ ] 1024×1024 px icon (no transparency, no alpha channel)
- [ ] Icon matches brand guidelines (Ora branding)
- [ ] Icon is recognizable at small sizes
- [ ] Icon uploaded to App Store Connect

**Files:**
- `/assets/icon.png` (app bundle)
- `/app-store-assets/icon-1024.png` (App Store Connect)

**Design Notes:**
- Use Ora brand colors (purple gradient)
- Simple, memorable design
- Works on light and dark backgrounds

---

### ✅ 2. Screenshots

**Required Sizes:**
iPhone 6.7" Display (iPhone 14 Pro Max, 15 Pro Max):
- [ ] 1290×2796 px (portrait) × 3 screenshots minimum

iPhone 6.5" Display (iPhone 11 Pro Max, XS Max):
- [ ] 1242×2688 px (portrait) × 3 screenshots minimum

iPad Pro 12.9" Display:
- [ ] 2048×2732 px (portrait) × 2 screenshots minimum

**Screenshot Content (5 total recommended):**
1. [ ] **Chat Interface** - "Your AI Companion" headline
2. [ ] **Meditation Library** - "Mindfulness Made Simple" headline
3. [ ] **Community** - "You're Not Alone" headline
4. [ ] **Journaling** - "Your Thoughts, Your Growth" headline
5. [ ] **Letters** - "Messages That Matter" headline

**Design Requirements:**
- Clean, on-brand mockups
- Show actual app UI (no generic stock photos)
- Add marketing text overlays for clarity
- Use status bar with good signal/battery
- Consistent background colors

**Files Location:**
`/app-store-assets/screenshots/`

---

### ✅ 3. App Preview Video (Optional but Recommended)

**Requirements:**
- [ ] 15-30 seconds long
- [ ] 1080p resolution minimum
- [ ] No audio required (or soft background music)
- [ ] Show key features: chat, meditation, community

**Storyboard:**
1. Open with Ora logo + tagline (2s)
2. Show chat interaction (5s)
3. Browse meditation library + start session (5s)
4. Community feed scroll + post (5s)
5. Close with "Download Ora AI" CTA (3s)

**Files Location:**
`/app-store-assets/preview-video.mp4`

---

### ✅ 4. App Description & Metadata

- [ ] **App Name:** "Ora AI - Your Wellness Companion" (30 chars)
- [ ] **Subtitle:** "Mindfulness, Journal & Support" (30 chars)
- [ ] **Promotional Text:** Compelling 170-char hook (see APP_STORE_METADATA.md)
- [ ] **Description:** Full 4000-char description written (see APP_STORE_METADATA.md)
- [ ] **Keywords:** 100 chars optimized for search (see APP_STORE_METADATA.md)
- [ ] **What's New:** v1.0 launch notes prepared
- [ ] **Support URL:** https://ora-ai.app/support
- [ ] **Marketing URL:** https://ora-ai.app

**Reference:** `APP_STORE_METADATA.md`

---

### ✅ 5. Privacy Policy

- [ ] Privacy policy written and hosted
- [ ] **Privacy Policy URL:** https://ora-ai.app/privacy
- [ ] Privacy policy covers:
  - [ ] Data collection (chats, meditation data, community posts)
  - [ ] Data usage (AI processing, personalization)
  - [ ] Data storage (encryption, security)
  - [ ] Data sharing (none - we don't sell data)
  - [ ] User rights (access, deletion, export)
  - [ ] Third-party services (AI providers, analytics)

**Privacy Policy Status:** ⚠️ **REQUIRED** - Must be live before submission

---

### ✅ 6. Age Rating & Content

**Recommended Rating:** 12+ (Infrequent/Mild Medical/Treatment Information)

**Age Rating Questionnaire (App Store Connect):**
- [ ] Cartoon/Fantasy Violence: None
- [ ] Realistic Violence: None
- [ ] Sexual Content/Nudity: None
- [ ] Profanity/Crude Humor: None
- [ ] Alcohol/Tobacco/Drug Use: None
- [ ] Mature/Suggestive Themes: None
- [ ] Simulated Gambling: None
- [ ] Horror/Fear Themes: None
- [ ] **Medical/Treatment Information:** Infrequent/Mild (mental wellness content)

**Why 12+?**
- App deals with mental health topics
- Users share personal experiences (moderated)
- AI provides emotional support (not medical advice)
- Community discussions about wellness challenges

**Content Warnings:**
- Community content is moderated
- App includes mental health resources
- Users can report inappropriate content

---

### ✅ 7. App Review Notes

**Test Account Credentials:**
```
Email: reviewtest@ora-ai.app
Password: AppReview2026!
```

**Review Notes for Apple:**
```
Thank you for reviewing Ora AI!

Test Account:
- Email: reviewtest@ora-ai.app
- Password: AppReview2026!

The test account has sample data populated to demonstrate:
1. Chat conversations with AI
2. Meditation library with completed sessions
3. Community posts and comments
4. Saved letters

Key Features to Test:
1. Chat - Type any message to the AI for supportive conversation
2. Meditation - Select any session from the library and press play
3. Community - Browse posts, add comments, create a new post
4. Letters - View sample letters in the Letters tab under Community

AI Features:
- Chat responses are powered by GPT-4 (OpenAI API)
- All AI conversations are monitored for safety
- Users can report inappropriate AI responses

Community Moderation:
- All posts are reviewed before going live
- Users can report content
- Moderators review flagged content within 24 hours

Mental Health Resources:
- App includes crisis resources (988 Suicide & Crisis Lifeline)
- Disclaimer: App is not a substitute for professional therapy
- Users are encouraged to seek professional help for serious issues

Contact:
- Email: support@ora-ai.app
- Phone: [Add phone number]

Thank you!
```

---

### ✅ 8. Build Upload

**Build Checklist:**
- [ ] Version number set (1.0.0 for initial release)
- [ ] Build number incremented
- [ ] Release build configuration (not debug)
- [ ] Code signing certificate valid
- [ ] Provisioning profile configured
- [ ] All required capabilities enabled (Push Notifications, Background Modes)
- [ ] Third-party SDKs disclosed (OpenAI, analytics, crash reporting)

**Upload Methods:**
- [ ] **Xcode:** Product → Archive → Upload to App Store Connect
- [ ] **EAS (Expo Application Services):** `eas build --platform ios --profile production`

**Verify Upload:**
- [ ] Build appears in App Store Connect under "TestFlight" tab
- [ ] Build status: Processing → Ready to Submit
- [ ] No warnings or errors in build review

**Post-Upload:**
- [ ] Assign build to app version in App Store Connect
- [ ] Add "What to Test" notes for TestFlight (if testing first)

---

### ✅ 9. App Information

**General Information:**
- [ ] **Category (Primary):** Health & Fitness
- [ ] **Category (Secondary):** Lifestyle
- [ ] **Copyright:** © 2026 Ora AI, Inc.
- [ ] **Trade Representative Contact Info:** [Name, Address, Phone]

**Contact Information:**
- [ ] **First Name:** [Your first name]
- [ ] **Last Name:** [Your last name]
- [ ] **Phone Number:** [Your phone]
- [ ] **Email Address:** support@ora-ai.app

**App Review Information:**
- [ ] **Phone Number:** [Your phone for urgent contact]
- [ ] **Email Address:** reviews@ora-ai.app
- [ ] **Demo Account Username:** reviewtest@ora-ai.app
- [ ] **Demo Account Password:** AppReview2026!
- [ ] **Notes:** (See section 7 above)

---

### ✅ 10. Pricing & Availability

**Pricing:**
- [ ] **Price:** Free with in-app purchases (freemium model)
- [ ] **In-App Purchases Configured:**
  - [ ] Premium Monthly Subscription ($9.99/month)
  - [ ] Premium Annual Subscription ($79.99/year - save 33%)

**Availability:**
- [ ] **Countries:** All territories (worldwide launch)
- [ ] **Pre-Order:** No (immediate availability after approval)

**Release Options:**
- [ ] **Manually release this version:** Recommended (you control launch timing)
- [ ] **Automatically release after approval:** Not recommended for v1.0

---

### ✅ 11. App Privacy Details

**Data Collection (Examples):**

**Collected & Linked to User:**
- [ ] Health & Fitness (meditation data, mood logs)
- [ ] Identifiers (email address, user ID)
- [ ] User Content (chat messages, journal entries, community posts)
- [ ] Usage Data (features used, session duration)

**Collected but Not Linked:**
- [ ] Diagnostics (crash reports, error logs)

**Not Collected:**
- Financial Information (handled by Apple for subscriptions)
- Location Data
- Contacts
- Photos/Videos (unless user uploads to community)

**Data Use:**
- [ ] App functionality (primary use case)
- [ ] Personalization (AI recommendations)
- [ ] Analytics (improve app experience)

---

### ✅ 12. Export Compliance

**Encryption Usage:**
- [ ] **Uses Encryption:** Yes
- [ ] **Exempt from Export Compliance:** Yes (HTTPS, standard encryption only)

**Explanation:**
"This app uses HTTPS for network requests and standard iOS encryption APIs. No custom cryptography is implemented."

---

### ✅ 13. Content Rights

**Music/Audio:**
- [ ] Meditation audio files: Royalty-free or licensed
- [ ] Ambient sounds: Royalty-free or licensed
- [ ] No copyrighted music without permission

**Images/Icons:**
- [ ] All icons: Custom-designed or licensed (Iconify, Noun Project, etc.)
- [ ] No stock photos without proper licensing

**Text/Copy:**
- [ ] All app copy original
- [ ] Quotes/prompts properly attributed

---

### ✅ 14. Pre-Launch Testing

**Internal TestFlight:**
- [ ] TestFlight build distributed to team
- [ ] Core features tested (chat, meditation, community)
- [ ] Payment flow tested (sandbox environment)
- [ ] Crash reporting verified
- [ ] Analytics tracking verified

**External TestFlight (Optional):**
- [ ] Invite beta testers (50-100 users)
- [ ] Collect feedback on bugs and UX
- [ ] Iterate based on feedback

**Final Smoke Tests:**
- [ ] Fresh install on physical device (not simulator)
- [ ] Sign up flow works
- [ ] Chat AI responds correctly
- [ ] Meditation plays audio
- [ ] Community loads posts
- [ ] Subscription purchase flow works (sandbox)
- [ ] App doesn't crash on common actions

---

### ✅ 15. Legal & Compliance

**Terms of Service:**
- [ ] Terms of Service written and hosted
- [ ] **Terms URL:** https://ora-ai.app/terms
- [ ] Users agree to terms on signup

**COPPA Compliance (if applicable):**
- [ ] App not directed at children under 13
- [ ] Age gate on signup (must be 13+ or age of consent)

**GDPR Compliance (if serving EU users):**
- [ ] Privacy policy GDPR-compliant
- [ ] Users can request data export
- [ ] Users can request data deletion

**Mental Health Disclaimers:**
- [ ] App includes disclaimer: "Not a substitute for professional therapy"
- [ ] Crisis resources included (988, Crisis Text Line)
- [ ] AI responses monitored for safety

---

### ✅ 16. Marketing & Launch Plan

**Pre-Launch:**
- [ ] Landing page live (https://ora-ai.app)
- [ ] Social media accounts created
- [ ] Email list for launch notifications
- [ ] Press kit prepared (logo, screenshots, description)

**Launch Day:**
- [ ] Submit for review (2-7 days review time typically)
- [ ] Prepare social media announcements
- [ ] Email list notified when live
- [ ] Product Hunt launch (optional)

**Post-Launch:**
- [ ] Monitor App Store reviews daily
- [ ] Respond to user feedback
- [ ] Track crash reports and fix bugs
- [ ] Plan v1.1 update based on feedback

---

## Final Pre-Submission Checklist

Before hitting "Submit for Review," verify:

- [ ] All 16 sections above are 100% complete
- [ ] Test account credentials work
- [ ] Build uploaded and assigned to version
- [ ] Privacy policy and terms of service live
- [ ] All screenshots and videos uploaded
- [ ] App metadata complete and reviewed
- [ ] Age rating configured correctly
- [ ] Pricing and in-app purchases set up
- [ ] App Store Connect team members have correct roles
- [ ] Contact information up-to-date

**Estimated Review Time:** 2-7 days  
**Approval Rate (first submission):** ~50-60% (be thorough!)

---

## Common Rejection Reasons (Avoid These!)

1. **Incomplete metadata:** Missing screenshots, privacy policy, or description
2. **Broken features:** Crashes, non-functional buttons, broken links
3. **Misleading screenshots:** Screenshots don't match actual app
4. **Privacy issues:** Not disclosing data collection, missing privacy policy
5. **Content issues:** Inappropriate content, offensive language
6. **Legal issues:** Missing terms of service, COPPA violations
7. **Guideline violations:** Health claims without disclaimers, gambling mechanics

---

## Post-Approval Steps

Once approved:
1. [ ] Release app manually (or let it auto-release)
2. [ ] Monitor crash reports in first 24 hours
3. [ ] Respond to initial user reviews
4. [ ] Post launch announcements
5. [ ] Begin work on v1.1 improvements

---

**Document Version:** 1.0  
**Date:** February 13, 2026  
**Status:** Pre-launch checklist ready  
**Next Review:** Before submission
