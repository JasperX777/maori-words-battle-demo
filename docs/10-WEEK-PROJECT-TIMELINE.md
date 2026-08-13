# Māori Words Battle – 10-Week Project Timeline

## 1. Project Overview

Māori Words Battle is a board-game-inspired mobile application designed to help children and adults learn Māori history and vocabulary through multiplayer gameplay and structured learning activities. Players can compete or collaborate in game rooms, choose from three difficulty levels, review unfamiliar words, use a Māori dictionary, and learn through stories and videos. Progress tracking and replayable activities are intended to reinforce memory and encourage continued learning.

The project uses React Native for the mobile application and Supabase for planned cloud services. The release goal is to improve functionality, stability, engagement, and Whakatōhea-focused content so that the application can reach release-candidate quality for Google Play and the Apple App Store.

## 2. Planning Assumptions

- The team consists of two people, identified below as **Member A** and **Member B**. These labels can be replaced with the team members' names.
- Weeks 1 and 2 cover discovery, planning, documentation, and prototype validation. Formal development begins in Week 3.
- The existing prototype can be reused, but simulated login or multiplayer behaviour must not be treated as production-ready cloud functionality.
- Whakatōhea language, history, imagery, and stories must be reviewed by an appropriate cultural adviser or community representative before public release.
- Week 10 targets a tested release candidate and store-submission package. Approval by Google or Apple depends on their external review process and is not guaranteed within the ten-week period.

## 3. Team Responsibilities

| Role    | Primary focus | Supporting responsibilities |
|---------| --- | --- |
| Jasper  | React Native architecture, gameplay, authentication integration, automated testing, and mobile builds | Code review, technical documentation, bug fixing, and release support |
| Jazeena | Supabase data and Realtime integration, learning features, content workflow, UX, and manual QA | Code review, cultural research coordination, product documentation, and store materials |

Both members remain responsible for design decisions, peer review, weekly demonstrations, and keeping project documentation current.

## 4. Ten-Week Timeline

| Week | Goal | Jasper | Jazeena | Deliverables and completion check |
| --- | --- | --- | --- | --- |
| **1 – Discovery and research** | Understand the organisation, users, cultural context, and game concept. | Review the existing application and technical constraints. Map the proposed board-game loop, three difficulty levels, scoring, turn flow, and multiplayer states with the supervisor. | Research Whakatōhea history, regional vocabulary, learning needs, and relevant board-game mechanics. Record source and cultural-review requirements. | Project background summary; target-user definition; research notes and references; initial user flow; supervisor-confirmed game rules and project scope. |
| **2 – Documentation and prototype** | Turn the agreed concept into an executable project plan and testable prototype. | Write the project document: problem, objectives, scope, user stories, milestones, risks, and acceptance criteria. Build or refine the interactive prototype for login, home, room, gameplay, feedback, and results. | Write the development document: technology stack, setup, architecture, data model, Git workflow, testing approach, and security rules. Prepare wireframes and a starter content structure for Daily Māori and Learn Mode. | Approved project document; reproducible development guide; clickable or runnable end-to-end prototype; prototype feedback recorded with agreed Week 3 backlog. |
| **3 – Development foundation** | Begin formal development with a stable structure and quality baseline. | Define the app architecture and navigation boundaries. Extract testable gameplay logic from prototype-only UI where necessary. Configure unit tests and continuous type checking. | Define the Supabase development schema and environment setup using placeholder credentials only. Build reusable screens/components and the initial profile/progress data interfaces. | App launches on target development devices; core navigation works; schema and interfaces are documented; baseline type checks and tests pass. |
| **4 – Authentication and user profiles** | Implement secure sign-in and persistent player identity. | Integrate supported OAuth flows and session handling in the React Native app. Add logout, loading, cancellation, and authentication error states. | Implement profiles and learning-progress storage in Supabase. Add Row Level Security policies and test access using at least two different test users. | A user can sign in, reopen the app with a valid session, view a profile, and sign out; unauthorised profile access is rejected; authentication tests pass. |
| **5 – Real multiplayer rooms** | Replace simulated room behaviour with cross-device room creation and joining. | Implement create-room, join-by-code, lobby, ready/cancel-ready, host controls, and clear connection states in the app. | Implement room membership, player presence, Realtime subscriptions, room-code uniqueness, and access-control rules in Supabase. Test concurrent joins. | Two physical devices or simulators can create/join the same room, see consistent lobby state, start only when rules are satisfied, and handle a player leaving. |
| **6 – Multiplayer gameplay and three levels** | Complete the main game loop with trustworthy shared state. | Implement the three gameplay levels, round transitions, timer UI, answer feedback, leaderboard, and final results. Add unit tests for answer normalisation and scoring rules. | Implement server-controlled question order, answer validation, score updates, duplicate-submission protection, and basic reconnect recovery. Run multiplayer integration tests. | Two clients complete a full game and receive consistent questions, timing, scores, and results; all three levels pass agreed acceptance scenarios. |
| **7 – Daily Māori and progress tracking** | Turn unfamiliar words and progress data into a useful learning loop. | Build dictionary search, word detail, save/remove unfamiliar word, review session, and progress visualisation. Add accessible empty, loading, and error states. | Implement dictionary/content queries, per-user unfamiliar-word storage, review history, and a simple spaced-review schedule. Add tests for persistence and user isolation. | Saved words survive restart and appear only for the correct user; review activity updates progress; dictionary and personalised-review flows pass functional tests. |
| **8 – Learn Mode, Whakatōhea content, and engagement** | Expand learning value and replayability without weakening cultural accuracy. | Implement storybook and video learning screens, completion tracking, and selected engagement features such as achievements, challenges, or meaningful rewards. | Prepare and integrate Whakatōhea-focused vocabulary and learning content. Coordinate cultural review, record attribution/permissions, and revise rejected or uncertain material. | Learn Mode works on target devices; selected engagement loop is measurable and replayable; content has a recorded source, permission status, and cultural-review status. |
| **9 – Stabilisation and beta testing** | Find and resolve release-blocking defects across devices and user journeys. | Expand automated tests for gameplay, authentication, room recovery, and progress. Profile performance, fix high-priority crashes, and check production configuration for exposed secrets. | Run structured Android and iOS regression tests, accessibility checks, small-screen checks, interrupted-network scenarios, and supervised user testing. Triage results with severity and reproduction steps. | No unresolved release-blocking defects; critical user journeys pass on agreed Android/iOS devices; test report, issue log, and beta feedback summary are complete. |
| **10 – Release candidate and handover** | Package a defensible release candidate and complete project handover. | Produce signed release-candidate builds using protected release configuration. Verify versioning, production connectivity, crash reporting, and final automated checks. | Prepare store descriptions, screenshots, icon/feature assets, support details, content attribution, privacy information, and final user/developer documentation. Coordinate the final demonstration. | Installable Android and iOS release candidates; completed release checklist and store-submission package; final project report, demonstration, known-issues list, and prioritised next backlog. |

## 5. Milestones

| Milestone | Target | Evidence |
| --- | --- | --- |
| Scope and design approved | End of Week 1 | Supervisor-approved rules, research summary, and agreed scope |
| Prototype and plan approved | End of Week 2 | Project document, development document, and demonstrated prototype |
| Development baseline ready | End of Week 4 | Tested architecture, real authentication, protected profiles, and passing checks |
| End-to-end multiplayer complete | End of Week 6 | Two-client game covering all three levels with consistent results |
| Learning scope complete | End of Week 8 | Daily Māori, progress, Learn Mode, engagement feature, and reviewed content status |
| Release candidate complete | End of Week 10 | Cross-platform builds, test evidence, release checklist, and handover package |

## 6. Weekly Working Method

1. At the start of each week, both members select tasks from the agreed backlog and confirm the acceptance criteria.
2. Each feature begins with a failing test or a reproducible acceptance scenario where practical.
3. The implementing member completes the smallest required change; the other member reviews it before merge.
4. Both members run relevant automated checks and manually test the affected flow on at least one target device.
5. At the end of the week, the team demonstrates the deliverable, records supervisor feedback, updates risks, and adjusts only the remaining backlog.

## 7. Key Dependencies and Risks

- **Cultural accuracy:** Whakatōhea-specific material cannot be marked release-ready until an authorised reviewer has approved it.
- **External accounts:** OAuth provider setup, Apple/Google developer accounts, signing configuration, and store access must be available early enough to avoid blocking Week 10.
- **Multiplayer reliability:** Realtime gameplay needs testing with multiple identities, devices, poor networks, reconnection, and simultaneous input.
- **Security and privacy:** Supabase policies must be verified with separate users. No password, service-role key, token, or real secret may be stored in the repository or documentation.
- **Schedule control:** Additional game modes, social features, advanced reward systems, or large content expansions should enter the post-release backlog unless the supervisor explicitly replaces an existing deliverable.
