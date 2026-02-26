# The Reasoning Engine - UI/Frontend Documentation

## Overview
Demo UI for The Reasoning Engine MVP - "Cursor for Product Management"

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Icons:** Lucide React
- **Dark Mode:** Built-in support

## Project Structure

```
reasoning-engine/
├── app/
│   ├── page.tsx              # Landing page
│   ├── demo/
│   │   └── page.tsx          # Main demo page
│   ├── layout.tsx            # Root layout (dark mode enabled)
│   └── globals.css           # Global styles with CSS variables
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── card.tsx
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   ├── textarea.tsx
│   │   ├── accordion.tsx
│   │   └── alert.tsx
│   ├── ContextInput.tsx      # Raw context input component
│   ├── SpecViewer.tsx        # Executable Spec display
│   ├── SimulationResults.tsx # Pre-code simulation results
│   └── LoadingState.tsx      # Loading skeleton/spinner
├── lib/
│   ├── utils.ts              # Utility functions (cn helper)
│   └── types.ts              # TypeScript types
└── README.md
```

## Components

### 1. ContextInput.tsx
**Purpose:** Large textarea for pasting unstructured context

**Features:**
- Example placeholder showing realistic input format
- Disabled state during loading
- Full height with scroll

**Example Input:**
```
Slack threads, customer feedback, GitHub issues, interview transcripts
```

### 2. SpecViewer.tsx
**Purpose:** Displays the generated Executable Specification

**Features:**
- Collapsible accordion sections for each layer:
  - **Narrative:** Title, objective, rationale
  - **Context Pointers:** Source links with snippets
  - **Constraints:** Severity badges (critical/warning/info)
  - **Verification:** Gherkin scenarios with color-coded syntax
- Empty state when no spec is generated
- Responsive layout

**Design Notes:**
- Uses color coding for Gherkin syntax (Given = blue, When = purple, Then = green)
- Severity badges use variant colors (red = critical, yellow = warning, gray = info)

### 3. SimulationResults.tsx
**Purpose:** Shows pre-code simulation test results

**Features:**
- Pass/fail badge in header
- Summary stats (total, passed, failed scenarios)
- Failure alerts with detailed reasons
- AI suggestions for improvements
- Success message when all tests pass

**Visual Design:**
- Green badges for passed
- Red badges for failed
- Yellow lightbulb icon for suggestions

### 4. LoadingState.tsx
**Purpose:** Animated loading state while LLM processes

**Features:**
- Spinning loader icon
- Progressive status messages
- Animated dots showing different processing stages

## Pages

### Landing Page (`/`)
**Sections:**
1. **Hero:** 
   - Headline: "Transform Chaos into Executable Specifications"
   - Subheadline: Explains the problem AI coding tools solved
   - CTA buttons: "Try the Demo" + "Watch Video"
   - Stats: 10x faster, 90% fewer hallucinations, Zero manual syncing

2. **Problem/Solution:**
   - Side-by-side comparison (Before/After cards)
   - Shows pain points vs. benefits

3. **Features:**
   - 4 feature cards with icons
   - Explains the 4 layers of Executable Specs

4. **CTA:**
   - Prominent call-to-action with gradient background
   - Direct link to demo page

5. **Footer:**
   - Simple credit line

### Demo Page (`/demo`)
**Layout:**
- **Header:** Title + description
- **Action Bar:** 
  - "Generate Executable Spec" button (primary)
  - "Export for Cursor/Claude" button (outline, only visible after generation)
- **Two-Column Grid:**
  - Left: ContextInput
  - Right: SpecViewer (or LoadingState)
- **Bottom Panel:** SimulationResults (appears after generation)

**Interaction Flow:**
1. User pastes context in left panel
2. User clicks "Generate" button
3. LoadingState shows in right panel (3 second mock delay)
4. SpecViewer displays generated spec
5. SimulationResults shows at bottom with pass/fail
6. User can export the spec as JSON

**Mock Data:**
Currently uses hardcoded mock data simulating:
- Multi-format export feature (CSV/JSON/XML)
- Context from Slack, GitHub, customer interviews
- Constraints about backward compatibility
- 2 Gherkin test scenarios
- 1 failed simulation with suggestions

## Design Philosophy

### Visual Style
- **Inspiration:** Cursor, Linear, Vercel
- **Aesthetic:** Modern, clean, developer-focused
- **Color Palette:** Neutral grays with blue accents
- **Typography:** Inter font (system-like)
- **Spacing:** Generous padding, breathing room

### Dark Mode
- Enabled by default (`<html className="dark">`)
- Uses CSS variables for theming
- All components support dark mode natively via Tailwind's `dark:` variants

### Responsive Design
- Mobile-friendly but optimized for desktop (demo will be on laptop)
- Grid collapses to single column on small screens
- Touch-friendly button sizes

## Color Coding

### Severity Badges
- **Critical:** Red (`bg-red-500`)
- **Warning:** Yellow (`bg-yellow-500`)
- **Info:** Gray (default)

### Gherkin Syntax
- **Given:** Blue (`text-blue-600`)
- **When:** Purple (`text-purple-600`)
- **Then:** Green (`text-green-600`)

### Alerts
- **Success:** Green border + checkmark icon
- **Failure:** Red border + X icon
- **Suggestion:** Yellow lightbulb icon

## Development

### Install Dependencies
```bash
cd reasoning-engine
npm install
```

### Run Dev Server
```bash
npm run dev
```

Visit http://localhost:3000

### Build for Production
```bash
npm run build
npm start
```

## Future Enhancements (Post-MVP)

### Phase 1: Real LLM Integration
- [ ] Replace mock data with actual Claude API calls
- [ ] Add API route `/api/generate-spec`
- [ ] Streaming responses for real-time updates
- [ ] Error handling for API failures

### Phase 2: Advanced Features
- [ ] Edit spec inline before export
- [ ] Version history (compare specs)
- [ ] Share spec via unique URL
- [ ] Import from Notion/Jira/GitHub

### Phase 3: Collaboration
- [ ] Comments on spec sections
- [ ] Approval workflow
- [ ] Slack/Discord notifications on spec changes

## Design Decisions

### Why Mock Data?
For the incubator demo, we want to show the UI/UX without dependency on external APIs. This allows:
- Faster iteration on design
- Predictable demo experience
- No API costs during development

### Why Dark Mode Default?
The irony of building "Cursor for PM" is not lost on us. Dark mode is the developer aesthetic, and our target users (YC founders doing "vibe coding") will appreciate it.

### Why Two-Panel Layout?
Inspired by Cursor's editor layout (code on left, AI chat on right). Familiar pattern for our target audience.

### Why Export as JSON?
JSON is machine-readable and can be consumed by:
- Cursor via MCP protocol
- Claude via context files
- Custom integrations
- Version control (Git-friendly)

## Screenshots/Layout Description

### Landing Page
```
┌─────────────────────────────────────────────┐
│  [Badge: Cursor for PM]                     │
│                                              │
│  Transform Chaos into                        │
│  Executable Specifications                   │
│                                              │
│  [Try the Demo] [Watch Video]               │
│                                              │
│  [10x faster] [90% fewer] [Zero syncing]    │
└─────────────────────────────────────────────┘
│                                              │
│  The Crisis                                  │
│  ┌──────────────┐ ┌──────────────┐          │
│  │ Before       │ │ After         │          │
│  │ ❌ Scattered │ │ ✅ Unified    │          │
│  └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────┘
│                                              │
│  How It Works                                │
│  ┌──────────────┬──────────────┐            │
│  │ Context      │ Constraint   │            │
│  │ Intelligence │ Layer        │            │
│  ├──────────────┼──────────────┤            │
│  │ Pre-Code     │ Gherkin      │            │
│  │ Simulation   │ Verification │            │
│  └──────────────┴──────────────┘            │
└─────────────────────────────────────────────┘
```

### Demo Page
```
┌─────────────────────────────────────────────┐
│  The Reasoning Engine                       │
│  Transform chaos into executable specs      │
│                                              │
│  [Generate Spec] [Export for Cursor]        │
└─────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────┐
│ Raw Context      │ Executable Specification │
│                  │                          │
│ [Large textarea  │ ▼ Narrative Layer       │
│  with example    │   Title: Multi-Format..  │
│  placeholder]    │                          │
│                  │ ▼ Context Pointers       │
│                  │   Slack #customer-feed.. │
│                  │                          │
│                  │ ▼ Constraints            │
│                  │   [CRITICAL] DO NOT...   │
│                  │                          │
│                  │ ▼ Verification           │
│                  │   Scenario: User export..│
└──────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────┐
│ Pre-Code Simulation                          │
│ [FAILED Badge]                               │
│                                              │
│ 2 Total | 1 Passed | 1 Failed               │
│                                              │
│ ⚠️ Failures Detected                         │
│ ❌ Export fails gracefully...                │
│                                              │
│ 💡 AI Suggestions                            │
│ → Implement streaming export...              │
└─────────────────────────────────────────────┘
```

## Accessibility

- Semantic HTML (`<button>`, `<textarea>`, proper headings)
- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader friendly
- Color contrast meets WCAG AA standards

## Performance

- React Server Components where possible
- Client components only where needed (interactivity)
- Optimized images (none in MVP, but future-ready)
- CSS-in-JS avoided (Tailwind for fast builds)
- Code splitting via Next.js automatic routing

## Credits

**Built by:** Engineer Agent (Goody)  
**For:** The Reasoning Engine MVP  
**Stack:** Next.js + TypeScript + Tailwind + shadcn/ui  
**Design Inspiration:** Cursor, Linear, Vercel  
**Date:** February 2026
