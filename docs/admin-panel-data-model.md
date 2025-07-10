# Admin Panel Data Model & API Documentation

## Overview

The admin panel provides comprehensive management and analytics for user responses collected through interactive guides. Since there's no user authentication, responses are grouped by session-based `user_identifier` values.

## Data Model

### User Responses Table Schema

```sql
CREATE TABLE user_responses (
  id UUID PRIMARY KEY,
  guide_id UUID REFERENCES guides(id),
  slide_id UUID REFERENCES slides(id),
  block_id UUID REFERENCES content_blocks(id),
  user_identifier TEXT NOT NULL, -- Session-based identifier
  question TEXT NOT NULL,        -- Question text shown to user
  answer TEXT,                   -- User's text response
  file_url TEXT,                 -- URL of uploaded file
  file_name TEXT,                -- Original filename
  file_size INTEGER,             -- File size in bytes
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Key Concepts

1. **User Identifier**: Generated as `user_${timestamp}_${random}` and stored in browser sessionStorage
2. **Session-based Tracking**: Each browser session gets a unique identifier
3. **Response Types**: Text answers and file uploads
4. **Context Preservation**: Each response includes the original question text

## API Endpoints

### 1. Admin Overview - `/api/admin`

**GET Parameters:**
- `action`: One of `sessions`, `responses`, `stats`, `user_responses`
- `guide_id`: Required - The guide ID to query
- `user_identifier`: Required for `user_responses` action

#### Action: `sessions`
Returns all unique user sessions for a guide.

**Response:**
```json
{
  "sessions": [
    {
      "user_identifier": "user_1234567890_abc123",
      "first_activity": "2024-01-15T10:30:00Z",
      "last_activity": "2024-01-15T11:45:00Z",
      "total_responses": 5,
      "name": "John Doe", // If a "Name" question was answered
      "responses": [
        {
          "question": "What is your name?",
          "answer": "John Doe",
          "created_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

#### Action: `stats`
Returns aggregated statistics for a guide.

**Response:**
```json
{
  "stats": {
    "total_responses": 150,
    "unique_users": 25,
    "latest_response": "2024-01-15T14:30:00Z",
    "total_files": 12,
    "today_responses": 8
  }
}
```

#### Action: `user_responses`
Returns all responses for a specific user session, grouped by slides.

**Response:**
```json
{
  "user_responses": [
    {
      "slide_id": "slide-123",
      "slide_title": "Introduction",
      "responses": [
        {
          "block_id": "block-456",
          "question": "What is your name?",
          "answer": "John Doe",
          "file_url": null,
          "file_name": null,
          "file_size": null,
          "created_at": "2024-01-15T10:30:00Z",
          "block_type": "input-field"
        }
      ]
    }
  ],
  "user_identifier": "user_1234567890_abc123",
  "total_responses": 5
}
```

### 2. Original Responses API - `/api/responses`

**GET Parameters:**
- `guide_id`: Filter by guide
- `user_identifier`: Filter by user session
- `block_id`: Filter by specific block

**POST Body:**
```json
{
  "responses": [
    {
      "guide_id": "guide-123",
      "slide_id": "slide-456",
      "block_id": "block-789",
      "user_identifier": "user_1234567890_abc123",
      "question": "What is your name?",
      "answer": "John Doe"
    }
  ]
}
```

## Frontend Components

### 1. Admin Dashboard (`/admin`)

**Features:**
- Guide selection dropdown
- Response statistics cards
- User sessions list with search
- Export functionality

**Key Components:**
- `ResponseStats`: Displays statistics with growth indicators
- Session cards with user activity timeline
- Search and filter capabilities

### 2. Session Detail View (`/admin/session/[guideId]/[userId]`)

**Features:**
- Complete response history for a user session
- Responses grouped by slides
- File download functionality
- Export session data

**Key Components:**
- `FileDisplay`: Handles file previews and downloads
- Accordion layout for slide organization
- Response timeline

### 3. Reusable Components

#### FileDisplay Component
```tsx
<FileDisplay 
  fileUrl="https://example.com/file.pdf"
  fileName="document.pdf"
  fileSize={1024000}
  showDownload={true}
/>
```

#### ResponseStats Component
```tsx
<ResponseStats 
  stats={{
    total_responses: 150,
    unique_users: 25,
    latest_response: "2024-01-15T14:30:00Z",
    total_files: 12,
    today_responses: 8
  }}
  previousStats={{
    total_responses: 120,
    unique_users: 20,
    total_files: 8
  }}
/>
```

## Usage Examples

### 1. Finding User by Name

Since there's no authentication, you can identify users by their answer to a "Name" question:

```typescript
// In the sessions API response, look for responses with name-related questions
const nameResponse = session.responses.find(r => 
  r.question.toLowerCase().includes('name') ||
  r.question.toLowerCase().includes('what is your')
);

const userName = nameResponse?.answer || 'Anonymous';
```

### 2. Exporting Data

```typescript
// Export all responses for a guide
const response = await fetch(`/api/admin?action=responses&guide_id=${guideId}`);
const data = await response.json();

// Convert to CSV
const csvContent = convertToCSV(data.responses);
downloadFile(csvContent, `responses-${guideId}.csv`);
```

### 3. Tracking User Progress

```typescript
// Get user's progress through slides
const userResponses = await fetch(`/api/admin?action=user_responses&guide_id=${guideId}&user_identifier=${userId}`);
const data = await userResponses.json();

const completedSlides = data.user_responses.length;
const totalSlides = guide.slides.length;
const progressPercentage = (completedSlides / totalSlides) * 100;
```

## Limitations & Considerations

### 1. Session-based Identification
- Users are identified by browser session, not persistent accounts
- Clearing browser data creates a new "user"
- No cross-device tracking

### 2. Data Privacy
- All responses are publicly accessible (no RLS restrictions)
- Consider implementing access controls for sensitive data

### 3. Scalability
- Large response volumes may require pagination
- Consider caching for frequently accessed statistics

### 4. File Management
- Files are stored in R2/Cloudflare
- Implement cleanup for orphaned files
- Consider file size limits and type restrictions

## Future Enhancements

1. **User Management**: Implement proper authentication system
2. **Analytics**: Add response time tracking, completion rates
3. **Notifications**: Alert admins of new responses
4. **Bulk Operations**: Mass export, delete, or update responses
5. **Advanced Filtering**: Filter by date ranges, response types, etc.
6. **Real-time Updates**: WebSocket integration for live response monitoring 