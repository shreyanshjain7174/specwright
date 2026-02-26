/**
 * Test fixtures for ingestion tests
 */

export const slackMessage = {
  source_type: 'slack',
  channel: '#product-feedback',
  user: 'alice',
  timestamp: new Date('2024-01-15T10:30:00Z').toISOString(),
  content: 'Users keep asking for dark mode in the mobile app. Very frequent request in #feedback channel.',
};

export const jiraTicket = {
  source_type: 'jira',
  ticket_id: 'PROD-1234',
  title: 'Dark Mode Support',
  description: 'As a user I want to enable dark mode so that I can use the app in low-light environments without eye strain.',
  priority: 'High',
  timestamp: new Date('2024-01-14T08:00:00Z').toISOString(),
};

export const notionPage = {
  source_type: 'notion',
  page_id: 'abc123',
  title: 'Product Vision Q1 2024',
  content: `
## Dark Mode Feature

### User Research Findings
- 73% of surveyed users want dark mode
- Highest demand among developers and late-night users
- Competitors: GitHub, VS Code, Figma all have dark mode

### Requirements
1. Toggle between light/dark/system theme
2. Persist preference per user account
3. Smooth transition animation
  `.trim(),
  timestamp: new Date('2024-01-10T12:00:00Z').toISOString(),
};

export const callTranscript = {
  source_type: 'transcript',
  meeting_id: 'call-789',
  participants: ['PM', 'Designer', 'Engineer'],
  timestamp: new Date('2024-01-16T15:00:00Z').toISOString(),
  content: `
PM: So the main theme from user interviews is dark mode. Dark mode, dark mode, dark mode.
Designer: Yeah I've mocked it up already. The palette is ready.
PM: Great. How long would implementation take?
Engineer: With the design system in place, maybe two sprints for full coverage.
PM: Perfect. Let's prioritize this for Q1.
  `.trim(),
};

export const ambiguousRequirement = 'The system should respond fast and be intuitive for simple use cases.';
export const clearRequirement = 'The system MUST respond to API calls within 200ms at P99 under 1000 concurrent users.';

export const gherkinSpec = `
Feature: Dark Mode Toggle
  Scenario: User enables dark mode
    Given the user is on the Settings page
    When they toggle the "Dark Mode" switch
    Then the UI theme changes to dark
    And the preference is saved to their account
`.trim();

export const invalidGherkinSpec = `
Dark Mode Toggle
  User enables dark mode
    the user is on the Settings page
    toggle the Dark Mode switch
    the UI theme changes
`.trim();
