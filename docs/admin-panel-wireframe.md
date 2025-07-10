# Admin Panel Wireframe & UI Layout

## Main Dashboard (`/admin`)

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin Panel                    [Refresh] [Export]              │
│ Manage and view user responses                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Select Guide│ │Total Resp.  │ │Unique Users │ │File Uploads │ │
│ │ [Dropdown]  │ │    150      │ │     25      │ │     12      │ │
│ │             │ │  8 today    │ │  sessions   │ │  files      │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [User Sessions] [Export Data]                                   │
│                                                                 │
│ Search: [________________] [Export All]                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ User Session: user_1234567890_abc123                        │
│ │ [5 responses] [John Doe] [View Details]                     │
│ │ First: Jan 15, 10:30 AM | Last: Jan 15, 11:45 AM            │
│ │ Q: What is your name? A: John Doe...                        │
│ │ Q: Upload resume... A: [File: resume.pdf]                   │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ User Session: user_1234567891_def456                        │
│ │ [3 responses] [Anonymous] [View Details]                    │
│ │ First: Jan 15, 2:15 PM | Last: Jan 15, 2:30 PM              │
│ │ Q: What is your name? A: Jane Smith...                      │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Session Detail View (`/admin/session/[guideId]/[userId]`)

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back] Session Details                    [Export Session]   │
│ User responses and interactions                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Session Information                                          │
│ │ User ID: user_1234567890_abc123                             │
│ │ Total Responses: 5 | Slides Completed: 3                    │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Responses by Slide                                              │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ▼ Introduction (2 responses)                                │
│ │                                                             │
│ │ ┌─────────────────────────────────────────────────────────┐ │
│ │ │ Question 1 [input-field]                                │
│ │ │ Q: What is your name?                                   │
│ │ │ A: John Doe                                             │
│ │ │ Jan 15, 10:30 AM                                        │
│ │ └─────────────────────────────────────────────────────────┘ │
│ │                                                             │
│ │ ┌─────────────────────────────────────────────────────────┐ │
│ │ │ Question 2 [file-upload]                                │
│ │ │ Q: Upload your resume                                   │
│ │ │ 📎 resume.pdf (1.2 MB) [Download]                      │
│ │ │ Jan 15, 10:35 AM                                        │
│ │ └─────────────────────────────────────────────────────────┘ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ▼ Personal Information (1 response)                         │
│ │                                                             │
│ │ ┌─────────────────────────────────────────────────────────┐ │
│ │ │ Question 1 [input-field]                                │
│ │ │ Q: What is your email?                                  │
│ │ │ A: john@example.com                                     │
│ │ │ Jan 15, 11:00 AM                                        │
│ │ └─────────────────────────────────────────────────────────┘ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Main Dashboard Components
```
AdminPanel
├── Header (title + refresh button)
├── GuideSelector (dropdown)
├── ResponseStats (4 stat cards)
└── Tabs
    ├── UserSessions
    │   ├── SearchBar
    │   ├── SessionList
    │   │   └── SessionCard[]
    │   └── ExportButton
    └── ExportData
        └── ExportOptions
```

### Session Detail Components
```
SessionDetail
├── Header (back button + export)
├── SessionInfo (user ID + stats)
└── ResponseList
    └── SlideAccordion[]
        └── ResponseCard[]
            ├── QuestionDisplay
            ├── AnswerDisplay
            └── FileDisplay (if applicable)
```

## Key UI Patterns

### 1. Card-based Layout
- All major sections use cards for visual separation
- Consistent padding and spacing
- Clear hierarchy with titles and descriptions

### 2. Accordion for Slide Organization
- Slides are collapsible to manage space
- Shows slide title and response count
- Easy navigation through long response sets

### 3. Search and Filter
- Real-time search across user sessions
- Filter by name or user identifier
- Clear visual feedback for search results

### 4. File Handling
- Visual file type indicators (icons)
- File size display
- Download buttons for easy access
- Image previews when applicable

### 5. Statistics Display
- Large, prominent numbers
- Contextual badges and labels
- Growth indicators (arrows, percentages)
- Color coding for positive/negative trends

## Responsive Design

### Mobile Layout
```
┌─────────────────┐
│ Admin Panel     │
│ [Menu] [Export] │
├─────────────────┤
│ Select Guide    │
│ [Dropdown]      │
├─────────────────┤
│ Stats (stacked) │
│ [Card]          │
│ [Card]          │
│ [Card]          │
│ [Card]          │
├─────────────────┤
│ [Sessions]      │
│ Search: [____]  │
│                 │
│ Session Card    │
│ [Collapsed]     │
│ Session Card    │
│ [Collapsed]     │
└─────────────────┘
```

### Tablet Layout
```
┌─────────────────────────────────┐
│ Admin Panel    [Refresh][Export]│
├─────────────────────────────────┤
│ Guide: [Dropdown]               │
├─────────────────────────────────┤
│ Stats: [Card][Card]             │
│         [Card][Card]            │
├─────────────────────────────────┤
│ Sessions | Export               │
│ Search: [_____________]         │
│                                 │
│ [Session Card] [Session Card]   │
│ [Session Card] [Session Card]   │
└─────────────────────────────────┘
```

## Color Scheme & Theming

### Primary Colors
- **Primary**: Blue (#3B82F6) - Buttons, links, active states
- **Secondary**: Gray (#6B7280) - Text, borders, muted elements
- **Success**: Green (#10B981) - Positive trends, completed states
- **Warning**: Yellow (#F59E0B) - Attention, pending states
- **Error**: Red (#EF4444) - Errors, negative trends

### Component States
- **Default**: White background, gray borders
- **Hover**: Light blue background, blue borders
- **Active**: Blue background, white text
- **Disabled**: Gray background, muted text

## Accessibility Features

### Keyboard Navigation
- Tab order follows visual layout
- Enter/Space to expand accordions
- Escape to close modals/dropdowns

### Screen Reader Support
- Proper ARIA labels for interactive elements
- Descriptive alt text for images
- Semantic HTML structure

### Visual Indicators
- Clear focus states for keyboard users
- High contrast text and backgrounds
- Consistent icon usage with labels

## Loading States

### Skeleton Loading
```
┌─────────────────┐
│ ███████████████ │
│ ████ ████ ████  │
│ ████ ████ ████  │
│ ████ ████ ████  │
└─────────────────┘
```

### Progress Indicators
- Spinner for API calls
- Progress bars for file uploads
- Skeleton cards for content loading

## Error Handling

### Error States
```
┌─────────────────┐
│ ⚠ Error Message │
│ Failed to load  │
│ [Retry]         │
└─────────────────┘
```

### Empty States
```
┌─────────────────┐
│ 📭 No Data      │
│ No sessions     │
│ found           │
└─────────────────┘
``` 