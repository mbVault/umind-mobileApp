# U Mind Mobile App --- Frontend Requirements

## 1. Purpose

Build the U Mind mobile application using **React Native**. This README
is the frontend implementation brief for Cursor. The source of truth for
product behaviour and visual design is `U-Mind-MVP-Product-Spec.pdf`;
follow it rather than inventing new screens, colours, copy, or product
behaviour.

U Mind is an anonymous mental-wellness app. Its visual identity should
feel **warm, calm, human, and non-clinical**: cream backgrounds, indigo
actions, sunrise amber/coral accents, and soft serif headlines.

## 2. Scope for this phase

Implement the mobile frontend foundation and initial
authentication/onboarding flow.

**In scope** - App entry and session restoration. - Welcome screen. -
Anonymous alias and avatar selection. - Recovery-key display and
confirmation during registration. - Life-stage, gender, and
starting-feelings onboarding. - Recovery-key login for an existing
account. - Session persistence, refresh, logout. - Reusable design
tokens and common UI components. - Integration with the existing U Mind
backend.

**Out of scope for this phase:** Home features, mood tracking, diary,
Saathi chat, audio library/player, psychologist booking, subscriptions,
Her Cycle, and SOS flows. Do not add phone/email registration; U Mind is
anonymous.

## 3. Typography --- mandatory

Use the two Google Fonts specified by the product design:

-   **Fraunces** --- soft serif, weights **400 and 600**. Use for
    headlines, screen titles, names, logo lettering, diary title, and
    large breath counter.
-   **Manrope** --- rounded sans-serif, weights **400--800**. Use for
    body text, labels, inputs, buttons, metadata, captions, tabs, and
    overlines.
-   Fallbacks specified in the design: `Georgia, serif` for Fraunces and
    system sans-serif for Manrope.

### Font scale

Sizes are React Native logical pixels (dp). Treat line-height ratios as
guidance and implement equivalent practical `lineHeight` values.

  ---------------------------------------------------------------------------------
  Token      Font                Size        Weight   Line height Letter spacing /
                                                                  use
  ---------- ---------- ------------- ------------- ------------- -----------------
  Display    Fraunces              34           600         1.12× -0.02em; welcome
                                                                  headline

  H1         Fraunces          28--30           600         1.15× -0.02em; screen
                                                                  titles

  H2         Fraunces          24--26           600          1.2× -0.02em;
                                                                  feature/card
                                                                  titles

  H3         Fraunces          17--22           600          1.1× -0.01em; names
                                                                  and smaller serif
                                                                  titles

  Breath     Fraunces              56           600          1.0× Later
  counter                                                         audio-player
                                                                  screen

  Section    Manrope           15--16           800          1.3× Section/card
  title                                                           headings

  Body large Manrope               16      400--500          1.5× Supporting copy

  Body       Manrope           14--15      400--600          1.5× Descriptions and
                                                                  inputs

  Primary    Manrope               16      700--800           --- Button labels
  button                                                          

  Small      Manrope           13--14      700--800           --- Secondary/small
  button                                                          buttons

  Caption    Manrope           12--13      600--700         1.45× Hints, legal
                                                                  text, metadata

  Overline   Manrope           11--12           800           --- Uppercase; letter
                                                                  spacing
                                                                  0.05--0.06em

  Tab label  Manrope               11   700; active           --- Bottom
                                                800               navigation, later
                                                                  phase
  ---------------------------------------------------------------------------------

### Font implementation

-   Bundle/load the actual font files; do not rely on fonts installed on
    a device.
-   Use the family names exposed by the bundled files and central
    typography tokens. Confirm Android and iOS render intended weights.
-   Avoid synthetic bolding when the correct font weight is available.
-   Do not scatter font names, sizes, and weights throughout screen
    files.
-   Keep serif headlines and sans-serif interface text consistent.
-   Ensure long aliases and small screens do not clip text.

## 4. Design tokens

Define tokens centrally (for example, in `src/theme/`) and reuse them.
Do not introduce new hex values unless an approved token is added.

### Core colours

  Token              Hex         Use
  ------------------ ----------- ------------------------------------------
  `primary`          `#5B45E0`   Primary buttons, links, selected states
  `primaryPressed`   `#4331B8`   Pressed primary state
  `primaryTint`      `#ECE8FF`   Selected cards, privacy panels
  `track`            `#F1EAF9`   Segmented-control/system-note background
  `rail`             `#D8D0F7`   Progress connectors
  `ink`              `#1F1B3A`   Main text
  `inkMuted`         `#5F5A73`   Secondary text and captions
  `background`       `#FFF8F0`   Main cream screen background
  `surface`          `#FFFFFF`   Cards, inputs, surfaces
  `border`           `#EDE3DA`   Borders and dividers
  `sun`              `#FFB938`   Secondary CTA/accent
  `sunTint`          `#FFEFD0`   Recovery-key notice and warning panels
  `sunInk`           `#8A5A12`   Text on sun-tint
  `coral`            `#FF6B57`   Selected feelings/cause chips
  `coralTint`        `#FFE1DB`   Human-help tiles and selected accents
  `coralInk`         `#B83A24`   Text/icons on coral-tint
  `mint`             `#3CCFA0`   Calm mood/audio progress
  `mintTint`         `#D9F5EA`   Positive/reflective panels
  `mintInk`          `#0B6B4B`   Text on mint-tint

### Special colours for later screens

-   SOS: background `#FBEDE7`, border `#E9C3B6`, ink `#8E3A22`.
-   Audio player night theme: background `#2A1F6B`, surface `#3A2D8A`,
    ink/accent `#CFC7FF`.
-   Disabled: background `#F1ECE6`, ink `#8A918C`.
-   Human-help card: background `#FFF1EE`, border `#FFD2C9`.

### Mood colours for later screens

-   Heavy: `#5B5F97` (white text).
-   Low: `#8FB8F5` (text `#1F1B3A`).
-   Okay: `#B6A8FF` (text `#1F1B3A`).
-   Calm: `#3CCFA0` (text `#1F1B3A`).
-   Bright: `#FFB938` (text `#1F1B3A`).

### Life-stage colours

  Stage                     Accent      Tint
  ------------------------- ----------- -----------
  12--19 --- Growing up     `#E0452F`   `#FFE1DB`
  20--30 --- Starting out   `#5B45E0`   `#ECE8FF`
  30--45 --- Building       `#0B8A5F`   `#D9F5EA`
  45--60 --- Shifting       `#1971C2`   `#DDEEFF`
  60+ --- Wisdom years      `#B07600`   `#FFEFD0`

### Avatar colours

Use exactly these six selectable colours: `#D9480F`, `#5B45E0`,
`#0E8A62`, `#C2255C`, `#1971C2`, `#9C6B00`. Render the user's initial in
white.

## 5. Layout and components

Design reference viewport: **390 × 844**. This is a reference, not a
fixed size; adapt to actual device dimensions and safe areas.

-   Flow-screen horizontal padding: 24; tab-screen padding: 20.
-   Top padding: 40--48 below the status bar, respecting safe areas.
-   Spacing scale: 6, 8, 10, 12, 14, 22.
-   Primary button: 56 high, radius 28 (pill).
-   Small buttons/chips: 32--44 high, radius equal to half height.
-   Cards: radius 18--24, 1px border.
-   Inputs: 48--56 high, radius 16.
-   Icon tiles: 36--44, radius 12--14.
-   Minimum touch target: 44 × 44.
-   Text contrast: minimum 4.5:1; check muted text on tinted surfaces.
-   Line icons only, 1.8--2px stroke with rounded caps, usually
    16--24px. **Never use emoji as UI icons.**
-   State transitions: subtle 150--200ms ease-out. Respect
    reduced-motion/accessibility preferences where practical.
-   Respect safe areas, keyboard avoidance, screen readers, and device
    text scaling.

## 6. Initial screen flow

### Returning user

1.  Open app and restore session.
2.  If valid, route directly to Home (Home is outside this phase; use a
    clear placeholder/navigation target until implemented).
3.  If no valid session, show Welcome.

### New anonymous registration

1.  **Welcome**
    -   Logo lock-up: indigo circular mark, white "U", amber dot.
    -   Hero illustration: sun over hills using
        coral/lavender/indigo/amber palette; about 342 × 210, radius 28.
    -   Headline: "A quiet place for your mind." --- Fraunces 34/600,
        `ink`.
    -   Supporting copy --- Manrope 16, line-height 1.5, `inkMuted`.
    -   Three promise rows: no identity, AI availability, real
        psychologists.
    -   Primary CTA: "Begin anonymously".
    -   Secondary link: "I have a recovery key".
2.  **Anonymous name**
    -   Title: "What should we call you?" --- Fraunces 30/600.
    -   Alias input, 2--20 characters, default suggestion "Neela";
        reject email-like or phone-number-like aliases.
    -   Shuffle control generates five new alias suggestions.
    -   Six-colour, single-select avatar picker.
    -   Explain that the recovery key is the only way to restore the
        anonymous account.
    -   Continue button: "Continue as {alias}".
3.  **Recovery key**
    -   Title: "Your 12 private words" --- Fraunces 28/600.
    -   Display 12 numbered words in a 3 × 4 grid.
    -   Generate on-device using the product's specified BIP-39-style
        list.
    -   Provide copy/save actions and a warning that losing the words
        means the account cannot be recovered.
    -   Require confirmation that the user saved the words before
        continuing.
    -   Never log recovery words or persist them in plaintext.
4.  **Life stage & feelings**
    -   Title: "Which stage of life are you in?" --- Fraunces 26/600.
    -   Single-select life-stage cards using stage accent/tint tokens.
    -   Gender segmented control: Woman, Man, Prefer not to say.
    -   Starting feelings multi-select: Stressed, Anxious, Ghabrahat,
        Low, Can't sleep, Lonely.
    -   Persist the values and complete registration/onboarding.

### Existing user recovery/login

-   "I have a recovery key" opens the recovery flow.
-   Accept the 12 words in a clear, accessible entry UI; support pasting
    the key.
-   Explain that this restores access to the existing anonymous account.
-   Show loading and safe error states for invalid keys/network
    failures.
-   Successful recovery establishes a session and routes to Home.
-   No email, phone, password, or separate switch-account flow.

## 7. Backend integration

Use the existing backend contracts; do not invent endpoint paths or
payload fields. Agreed endpoints:

-   `POST /api/auth/register`
-   `POST /api/auth/recover`
-   `POST /api/auth/refresh`
-   `POST /api/auth/logout`
-   `GET /api/auth/session`
-   `GET /api/profile`
-   `PATCH /api/profile`
-   `PATCH /api/profile/preferences`
-   `PUT /api/profile/onboarding`

Before wiring requests, inspect the actual backend request/response
schemas. Keep the base URL in environment/configuration, not hard-coded
across screens.

-   Use a shared typed API client and consistent error handling.
-   Keep access tokens short-lived and refresh sessions according to the
    backend contract.
-   Store refresh credentials only in OS-backed secure storage, never
    plain AsyncStorage.
-   Never log tokens, recovery keys, or sensitive payloads.
-   Avoid refresh loops; if refresh fails, clear local session
    credentials and return to Welcome/recovery.
-   Logout revokes only the current session. It must not log out other
    devices.
-   Recovery on a new device must not invalidate existing sessions.
-   Biometrics stay client-side using native OS APIs; biometric data
    must never be transmitted to U Mind.
-   Account recovery and recovery of encrypted diary/chat content are
    separate. Do not promise historical content decryption unless the
    encryption-key recovery design supports it.

## 8. Anonymous identity and privacy

-   Do not request or collect real name, phone, email, contacts, or
    location.
-   Alias, avatar colour, life stage, and gender are linked to an
    anonymous user ID.
-   Never store or log the raw recovery key in plaintext.
-   Do not expose tokens/recovery words in analytics, crash reports,
    logs, or error messages.
-   Do not add third-party analytics in this phase unless explicitly
    approved.

## 9. Code organisation

Follow the existing repository structure; do not replace the project
setup or install a new navigation/state stack without first explaining
why.

Suggested boundaries: - `theme/` --- colour, spacing, typography,
radius, component tokens. - `components/` --- reusable buttons, text,
inputs, cards, chips, progress, avatar picker. - `screens/` --- welcome,
alias, recovery key, life stage/feelings, restore/login. - `navigation/`
--- onboarding/auth navigation and authenticated entry. - `services/` or
`api/` --- typed API client and endpoint methods. - `auth/` or `state/`
--- session state and auth orchestration. - `utils/` --- validation and
recovery-key normalisation without logging secrets.

These are suggested boundaries, not a mandate to force this exact tree
if the repository already has an established pattern.

## 10. Accessibility and quality

-   Accessible labels/roles for controls; icon-only controls need
    meaningful labels.
-   Make selection state clear without relying on colour alone.
-   Support keyboard visibility, scrolling, and small screens.
-   Prevent double submission and show loading states.
-   Use inline validation and safe retry states; never expose internal
    errors.
-   Keep UI text centralised/localisation-ready where practical.
    User-generated diary/chat content must support Hindi, English, and
    Hinglish.
-   No dead buttons or decorative controls that appear interactive.
-   Do not use placeholder data to pretend an API call succeeded.

## 11. Acceptance criteria

-   Fonts are bundled and render correctly on iOS and Android.
-   Screens use central tokens and match specified typography, spacing,
    colours, and shapes.
-   First launch follows Welcome → alias/avatar → recovery key → life
    stage/gender/starting feelings.
-   Returning users with valid sessions skip onboarding and enter the
    authenticated app.
-   Existing users can recover/login on another device without
    invalidating other sessions.
-   Logout affects only the current session.
-   API failures, invalid input, loading states, and expired sessions
    are handled clearly.
-   No raw recovery key or tokens are logged or stored insecurely.
-   No unapproved features or new colour values are introduced.
-   Run available typecheck, lint, tests, and platform build checks;
    report what actually passed.

## 12. Instructions to Cursor

Read this README and `U-Mind-MVP-Product-Spec.pdf` before coding. Treat
the product spec as the source of truth. First inspect the current React
Native repository and report its existing framework, navigation, and
dependency setup. Then implement the mobile foundation and scoped
authentication/onboarding screens incrementally. Do not silently invent
missing product decisions; call out genuine contradictions or missing
contracts before implementing the affected behaviour.
