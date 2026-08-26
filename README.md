# Blood Connect Now

BloodBridge — Real-Time Intelligent Blood Donor Matching

Build a hackathon-ready, production-style web application called BloodBridge.

Tagline

Right Blood. Right Donor. Right Distance. Right Time.

Product Vision

BloodBridge is an emergency blood donor matching platform that helps a patient or hospital quickly find nearby, eligible, available, and blood-compatible donors instead of relying on WhatsApp broadcasts or manually calling blood banks.

The application should feel like a real healthcare technology startup, not a basic college CRUD project.

Prioritize:

Beautiful, premium UI

Excellent UX

Fully working core interactions

Responsive design

Realistic demo data

Clear emergency workflows

Use mock/local data wherever a real backend or external API is unnecessary, but structure the application cleanly so real services can be integrated later.

1. DESIGN DIRECTION

Create a modern, trustworthy healthcare-tech visual identity.

Style

Minimal

Premium

Clean

Professional

Human-centered

Modern startup aesthetic

Use deep crimson/red as an accent, combined with white/off-white surfaces, dark typography, and subtle neutral tones.

Avoid:

Generic hospital website aesthetics

Excessive red

Excessive gradients

Huge rounded cards everywhere

Clutter

Overuse of animations

Fake-looking stock UI

Lorem ipsum

Use:

Strong typography

Excellent spacing

Clear hierarchy

Elegant cards

Status badges

Subtle shadows

Smooth micro-interactions

Professional icons

Meaningful empty/loading/error states

The application must look impressive when presented in a hackathon demo.

2. LANDING PAGE

Create a high-impact landing page.

Hero

Headline:

Every Second Counts. Every Donor Matters.

Supporting text:

BloodBridge connects patients with nearby, eligible blood donors in real time — helping emergency requests reach the right donor faster.

Primary CTA:

Find a Donor

Secondary CTA:

Become a Donor

Include a visually compelling blood/emergency-network concept without making the page look like a hospital advertisement.

Additional sections

Include:

How BloodBridge works

Why BloodBridge is different

Real-time donor matching explanation

Compatibility explanation

Emergency response workflow

Trust / verification section

Strong final CTA

3. USER ROLES

Support two roles:

Donor

A person willing to donate blood.

Blood Seeker

A patient, family member, or authorized person searching for blood.

Users should select their role during registration.

4. AUTHENTICATION

Create polished:

Login

Email

Password

Show/hide password

Remember me

Forgot password

Login

Register link

Registration

For donors:

Name

Email

Phone

Password

Blood group

Location

Last donation date

Availability

For seekers:

Name

Email

Phone

Password

Use proper validation.

For the prototype, use mock/local authentication if necessary.

5. DONOR DASHBOARD

Create a dedicated donor dashboard.

At the top show:

Blood group

Eligibility status

Availability

Verification status

Main sections

Availability

Large toggle:

🟢 Available
⚪ Unavailable

Changing this should immediately affect donor matching.

Nearby Emergency Requests

Display requests with:

Blood group

Units needed

Hospital

Distance

Urgency

Required-by time

Actions:

View Request

Accept

Statistics

Show useful summary cards:

Donations completed

Requests responded to

People helped

Current eligibility

6. SEEKER DASHBOARD

Create a dedicated blood seeker dashboard.

Show:

Active emergency requests

Matching donors

Request status

Previous requests

Include a prominent:

+ Create Emergency Request

button.

7. EMERGENCY BLOOD REQUEST

Create a polished emergency request form.

Fields:

Blood group

Units required

Hospital

Location

Required-by time

Urgency

Additional notes

Urgency:

🔴 Critical
🟠 Urgent
🟡 Normal

After submission, show a request tracking page.

Example:

Request #BB-1042

Progress:

Searching → Donors Notified → Donor Accepted → Fulfilled

Make this visually clear and easy to understand.

8. DONOR MATCHING ENGINE

This is the core feature.

Allow the seeker to search using:

Blood group

Location

Search radius

Units required

Urgency

Display compatible donors.

Each donor card should include:

Name

Blood group

Compatibility

Approximate distance

Availability

Eligibility

Verification badge

Estimated response time

Request button

Rank donors using:

Blood compatibility

Eligibility

Availability

Distance

Recent activity

Clearly show why a donor is recommended.

Example:

Best Match

Compatible • Eligible • Available • 3.2 km away

9. BLOOD COMPATIBILITY

Implement actual compatibility logic for:

A+

A-

B+

B-

AB+

AB-

O+

O-

Do NOT simply match identical blood groups.

Create reusable compatibility logic.

Incompatible donors must never appear as valid matches.

Display compatibility clearly using labels such as:

Compatible

or

Not Compatible

Treat this as a prototype and do not present it as medical advice.

10. DISTANCE MATCHING

Use realistic deterministic demo coordinates for donors.

Calculate approximate distance using latitude/longitude and the Haversine formula.

Allow:

5 km

10 km

25 km

50 km

Example:

18 compatible donors found within 10 km

Support sorting:

Nearest

Best Match

Do not generate random distances on every refresh.

11. FILTERING

Provide clean filter controls for:

Blood group

Distance

Availability

Eligibility

Verified donors

Include:

Clear Filters

Filtering must update results dynamically.

If no donors are found:

No eligible donors found within 10 km.

Then suggest:

Try expanding your search radius to 25 km.

12. DONOR MAP

Create a visually impressive map-style donor discovery interface.

If a real map API isn't available, create a polished simulated map using the deterministic demo locations.

Show donor markers.

Clicking a marker should display:

Blood group

Availability

Eligibility

Approximate distance

Keep the architecture ready for future Google Maps, Mapbox, or OpenStreetMap integration.

13. ELIGIBILITY

Create a simple prototype donor eligibility system based on:

Last donation date

Availability

Donor status

Show:

Eligible

Recently Donated

Unavailable

Keep the eligibility logic isolated so medical rules can be changed later.

Clearly label it as a prototype.

14. DEMO DATA

Populate the application with realistic deterministic data.

Include approximately:

15–20 donors

All major blood groups

Different locations

Different availability states

Different donation dates

Verified and unverified donors

Multiple emergency requests

The app should look populated immediately after launch.

15. NAVIGATION

Unauthenticated:

Home

How It Works

Find Blood

Become a Donor

Login

Register

Authenticated:

Dashboard

Find Donors / Requests

Emergency Request

Map

History

Profile

Logout

Make navigation responsive on mobile.

16. RESPONSIVENESS

The application must work beautifully on:

Desktop

Laptop

Tablet

Mobile

Do not simply shrink the desktop layout.

Create proper mobile navigation, cards, forms, dashboards, and filtering controls.

17. UX DETAILS

Implement:

Loading states

Skeleton states where useful

Empty states

Error states

Success states

Toast notifications

Confirmation dialogs

Form validation

Smooth transitions

Every important button must actually work.

Do not create fake buttons or decorative controls that have no functionality.

18. IMPORTANT PRODUCT DETAILS

Protect donor privacy.

Do not expose unnecessary exact personal information.

Prefer displaying:

3.2 km away

instead of revealing a donor's exact address.

Never display passwords or sensitive authentication data.

19. ENGINEERING QUALITY

Use a clean, maintainable architecture.

Prioritize:

Reusable components

Modular code

Reusable matching utilities

Reusable compatibility logic

Clean state management

Meaningful naming

No duplicated logic

No dead code

No unnecessary dependencies

Do not over-engineer the prototype.

20. BUILD PROCESS

Before implementing:

Inspect the current project.

Determine the existing stack.

Reuse the existing setup if appropriate.

Create a concise implementation plan.

Build the application.

Then actually run and test it.

21. QA & TESTING

Test these complete journeys:

Donor Journey

Register → Login → Complete profile → Set availability → Open dashboard → View emergency request → Accept request

Seeker Journey

Register → Login → Create emergency request → Select blood group → Find donors → Apply filters → View donor → Send request → Track request

Matching Tests

Verify:

Compatible blood groups appear.

Incompatible groups are excluded.

Distance filtering works.

Eligibility filtering works.

Availability changes affect results.

Sorting works.

Emergency request status updates correctly.

Visual QA

Check the application on desktop and mobile for:

Broken layouts

Overflow

Poor spacing

Inconsistent typography

Bad contrast

Broken navigation

Unfinished sections

Console/runtime errors

Fix problems instead of simply reporting them.

22. FINAL REQUIREMENT

Do not stop at a static mockup.

Actually build the working application, run it, test it, identify issues, fix them, and refine the UI.

The final result should be polished enough to demonstrate as a serious hackathon prototype.

At the end, briefly summarize:

Technology used

Features implemented

Main user flows

Testing performed

Bugs fixed

Prototype limitations

How to run the application

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/360d3d2e-d038-45f8-a252-3063abad5ff3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
