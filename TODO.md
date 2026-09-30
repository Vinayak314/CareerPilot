# CareerPilot To-Do List

This checklist is based on [CareerPilot_Technical_Overview.md](./CareerPilot_Technical_Overview.md). A checked item means the repository contains a visible implementation; it does not imply production readiness or that the feature has been tested.

## Project foundation

- [x] Create a React + Vite frontend.
- [x] Create a Node.js + Express backend.
- [x] Connect the backend to MongoDB through Mongoose.
- [ ] Add environment variable examples and setup documentation; configure production secrets securely.
- [ ] Deploy the frontend, backend, and database.

## Frontend page work (Figma references)

Use the screenshots in [`figma/`](./figma/) as the page layout and visual reference. The shared style guide is [`figma/design-system.png`](./figma/design-system.png): teal primary actions, slate text, green/amber/red match states, score rings, cards, and compact labels. Existing pages are starter implementations; checked items mean the page/component exists, not that it is complete or connected to live data.

### Shared app shell and navigation

- [x] Add a reusable sidebar with links for Dashboard, Resume Upload, Job Matches, Application Tracker, Interview Prep, and Settings.
- [ ] Add routes and page components for each sidebar destination; currently only `/dashboard` is routed.
- [ ] Show the sidebar on all signed-in app pages and keep the public landing/auth navigation separate.
- [ ] Make the active navigation item follow the current route, including nested routes.
- [ ] Replace the hard-coded David Miller / Premium Member avatar area with the signed-in user's profile data.
- [ ] Add responsive behavior for the sidebar on narrow screens (drawer or compact navigation).
- [ ] Add loading, empty, error, and success states that fit the design system.

### Landing page - [`figma/landing-desktop.png`](./figma/landing-desktop.png)

- [x] Build the hero section, primary upload CTA, analysis preview, three-step section, testimonials, and footer.
- [ ] Wire the "Upload Your Resume" CTA to the upload flow (or signup first when signed out).
- [ ] Replace placeholder `#` navigation links with working section anchors or routes.
- [ ] Give "Watch Interactive Demo" a real demo action or remove the inactive control.
- [ ] Replace static marketing claims and sample score data with approved content.
- [ ] Check the layout at mobile and tablet widths.

### Login and signup pages

- [x] Add login and signup forms and connect them to the client auth store.
- [ ] Match spacing, colors, typography, and form states to the shared Figma design system.
- [ ] Add field-level validation and accessible labels/error announcements.
- [ ] Keep return-to-page behavior after successful login and redirect signed-in users away from auth pages.
- [ ] Confirm loading, server error, duplicate email, and invalid credentials states are clear.

### Resume Upload - [`figma/upload-desktop.png`](./figma/upload-desktop.png)

- [ ] Create the `/upload` page using the signed-in sidebar layout.
- [ ] Add a drag-and-drop and browse-to-select resume dropzone.
- [ ] Support the intended file types (PDF/DOCX, and TXT if supported) and enforce a 10 MB maximum with clear validation.
- [ ] Show selected file name, size, upload progress, replace/remove actions, and upload errors.
- [ ] Add job-description URL and pasted-text inputs, with a clear separator and input validation.
- [ ] Add "Clear All" behavior and retain form state until the user clears or submits it.
- [ ] Add the analysis submit action, disabled/loading states, and helpful submission feedback.
- [ ] Connect the form to resume upload/analysis APIs and navigate to the resulting dashboard report.

### Dashboard - [`figma/dashboard-desktop.png`](./figma/dashboard-desktop.png)

- [x] Create the dashboard layout with an ATS score, category score cards, gap groups, recommendations, and advisor action buttons.
- [ ] Replace all sample employer, role, percentages, keyword gaps, and recommendations with the selected saved analysis.
- [ ] Render score rings and gap groups from API response data, including missing/empty values safely.
- [ ] Add loading, no-analysis, API error, and retry states; guide a first-time user to Resume Upload.
- [ ] Wire "Prep for Interview" and "Rewrite Resume" to their pages with the selected analysis context.
- [ ] Ensure long labels and many gaps wrap without breaking the layout on smaller screens.

### Rewrite Studio - [`figma/rewrite-desktop.png`](./figma/rewrite-desktop.png)

- [ ] Create the rewrite page and progress/header area shown in the reference.
- [ ] Show original resume bullets alongside generated suggestions, grouped by the source bullet.
- [ ] Display added keyword chips and any score forecast only when returned by the analysis/advisor API.
- [ ] Add accept, edit, and reject actions for each suggestion; make edit save the user's changes.
- [ ] Persist accepted versions and show clear saved/failed feedback.
- [ ] Add generation loading, empty, error, and retry states.
- [ ] Use the shared sidebar and make the page responsive for narrow screens.

### Interview Prep - [`figma/interview-prep-desktop.png`](./figma/interview-prep-desktop.png)

- [ ] Create the interview-prep page with role/company context and a "Start AI Mock Practice" action.
- [ ] Render questions with category and difficulty labels, suggested talking points, example response, and critical phrases.
- [ ] Add expand/collapse behavior for question cards and allow users to edit or save their prep notes if supported.
- [ ] Show interview insights and role-specific metrics only when supplied by the backend; avoid hard-coded company claims.
- [ ] Connect the page to generated interview-prep data for the selected analysis.
- [ ] Add loading, empty, error, and retry states and responsive layout behavior.

### Job Matches - [`figma/job-matches-desktop.png`](./figma/job-matches-desktop.png)

- [ ] Create the ranked job-match page with fit score rings and job cards.
- [ ] Show title, company, location/work mode, salary when available, aligned skills, warnings, and critical gaps.
- [ ] Add functional sorting and location filters with visible selected values and a clear/reset action.
- [ ] Connect cards to the ranked matches API and handle missing optional job fields.
- [ ] Make "Quick Apply" open the posting safely or clearly explain when no application URL exists.
- [ ] Let the user save a posting to the application tracker and prevent duplicate saves.
- [ ] Add loading, no-results, API error, and retry states; make cards usable on mobile.

### Application Tracker - [`figma/kanban-desktop.png`](./figma/kanban-desktop.png)

- [ ] Create the Kanban page with Saved, Applied, Interviewing, Offer, and Rejected columns.
- [ ] Render application cards with company, role, fit score, date/status, and optional notes or reminders.
- [ ] Add drag-and-drop across columns and persist status changes; restore the prior position if a save fails.
- [ ] Add an "Add Custom Job Tracking Card" flow with required-field validation.
- [ ] Support empty columns, loading/error states, and cards with incomplete optional data.
- [ ] Add keyboard-accessible alternatives to drag-and-drop and responsive horizontal/stacked column behavior.

### Settings - [`figma/settings-desktop.png`](./figma/settings-desktop.png)

- [ ] Create the Settings page with User Account Settings and Security Configuration tabs/sections.
- [ ] Load and edit the signed-in user's name and email; save updates with validation and confirmation feedback.
- [ ] List uploaded resumes with upload date and associated fit score when available; support safe deletion.
- [ ] Add notification preference controls and persist changes if notifications are implemented.
- [ ] Add security actions such as password change and sign out; do not show nonfunctional billing/premium controls unless billing exists.
- [ ] Connect profile/resume settings to authenticated APIs and protect against unauthorized access.
- [ ] Add loading, save/error, empty-resume, and responsive states.

### Frontend completion pass

- [ ] Use shared reusable components for score rings, severity tags, cards, buttons, form fields, and page headers.
- [ ] Ensure all clickable controls work, have accessible names/focus states, and are keyboard operable.
- [ ] Check color contrast and avoid using color alone to convey match severity.
- [ ] Verify every page at desktop, tablet, and mobile widths against its Figma reference.
- [ ] Remove demo-only hard-coded user/job/analysis content before presenting the app as personalized data.

## Authentication and accounts

- [x] Add user schema with name, unique email, password hash, and timestamps.
- [x] Hash passwords with bcrypt and compare them at login.
- [x] Add signup and login API endpoints that issue JWTs.
- [x] Add login and signup pages and client auth state.
- [ ] Validate request data and handle duplicate accounts and malformed input consistently.
- [ ] Replace the fallback JWT secret with a required environment variable.
- [ ] Protect authenticated routes and add an account/profile page and account management.

## Resume upload and analysis

- [ ] Build the resume upload and job-description input flow.
- [ ] Parse PDF/DOCX resumes and store parsed resume data and file metadata.
- [ ] Add Resume and Analysis data models.
- [ ] Implement the Analyzer agent with structured, validated output (ATS score, category scores, missing keywords, weak bullets, and formatting issues).
- [ ] Add the analysis API endpoint and persist results.
- [ ] Replace the dashboard's static sample scores and gaps with saved analysis results.

## AI advisor

- [ ] Implement the Advisor agent for resume bullet rewrites and interview questions.
- [ ] Add schema validation for generated output.
- [ ] Add rewrite and interview-prep API endpoints and corresponding pages.
- [ ] Orchestrate analysis and conditional advisor work in LangGraph, including parallel rewrite and interview-prep tasks.

## Job matching

- [ ] Integrate a job postings provider (Adzuna or JSearch) and configure its API key.
- [ ] Add local keyword pre-filtering and job-fit scoring.
- [ ] Add JobMatch data model and ranked job matches API.
- [ ] Build the Job Matches page with fit score and matched/missing skills.
- [ ] Cache postings and avoid unnecessary repeated scoring.

## Application tracker

- [ ] Add Application data model and CRUD API endpoints.
- [ ] Build the Kanban tracker and status columns.
- [ ] Add drag-and-drop status updates and persist changes through the API.

## Reliability, security, and observability

- [ ] Add authentication middleware to protected feature routes and handle missing/deleted users safely.
- [ ] Add rate limiting for analysis and advisor endpoints.
- [ ] Cache analyses by resume and job-description hash.
- [ ] Configure LangSmith tracing and record token usage, latency, and errors.
- [ ] Add error handling and input/file limits across the API.

## Documentation and delivery

- [ ] Write architecture overview documentation.
- [ ] Write setup instructions, including required environment variables and local run commands.
- [ ] Write the project report with methodology, agent design rationale, and measured evaluation results.
- [ ] Verify the full application flows and deployment configuration.
