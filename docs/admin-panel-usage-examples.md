# Admin Panel Usage Examples & Scenarios

## Getting Started

### 1. Accessing the Admin Panel
Navigate to `/admin` in your browser to access the main dashboard.

### 2. Selecting a Guide
Use the dropdown to select which guide's responses you want to view. The panel will automatically load statistics and user sessions for the selected guide.

## Common Use Cases

### Scenario 1: Reviewing All Responses for a Guide

**Goal**: Get an overview of all user interactions with a specific guide.

**Steps**:
1. Select the guide from the dropdown
2. Review the statistics cards:
   - Total responses (overall engagement)
   - Unique users (how many different people)
   - File uploads (how many files were submitted)
   - Latest activity (when was the last response)
3. Browse through user sessions in the "User Sessions" tab
4. Use the search bar to find specific users by name or ID

**Example Output**:
```
Guide: "Employee Onboarding"
- Total Responses: 150
- Unique Users: 25
- File Uploads: 12
- Latest Activity: Jan 15, 2:30 PM

User Sessions:
- John Doe (user_1234567890_abc123): 5 responses
- Jane Smith (user_1234567891_def456): 3 responses
- Anonymous (user_1234567892_ghi789): 2 responses
```

### Scenario 2: Analyzing Individual User Sessions

**Goal**: Understand how a specific user progressed through the guide.

**Steps**:
1. From the main dashboard, click "View Details" on any user session
2. Review the session information:
   - User identifier
   - Total responses
   - Slides completed
3. Expand each slide to see detailed responses
4. Download files if needed

**Example Session View**:
```
Session: user_1234567890_abc123
Total Responses: 5 | Slides Completed: 3

▼ Introduction (2 responses)
  Q: What is your name?
  A: John Doe
  
  Q: Upload your resume
  📎 resume.pdf (1.2 MB) [Download]

▼ Personal Information (1 response)
  Q: What is your email?
  A: john@example.com

▼ Work Experience (2 responses)
  Q: How many years of experience?
  A: 5 years
  
  Q: Upload portfolio
  📎 portfolio.pdf (3.5 MB) [Download]
```

### Scenario 3: Finding Users by Name

**Goal**: Locate responses from a specific person.

**Steps**:
1. Use the search bar in the User Sessions tab
2. Type the person's name (if they answered a name question)
3. Review matching sessions

**Search Examples**:
- Search for "John" to find all users with "John" in their name
- Search for "john@example.com" to find by email
- Search for user identifier prefix like "user_1234567890"

### Scenario 4: Exporting Data for Analysis

**Goal**: Get all response data in a spreadsheet format.

**Steps**:
1. Select the guide you want to export
2. Go to the "Export Data" tab
3. Click "Export All Responses (CSV)"
4. Open the downloaded file in Excel/Google Sheets

**CSV Structure**:
```csv
User ID,Question,Answer,File URL,File Name,Created At
user_1234567890_abc123,What is your name?,John Doe,,,2024-01-15 10:30:00
user_1234567890_abc123,Upload your resume,,https://example.com/file.pdf,resume.pdf,2024-01-15 10:35:00
user_1234567891_def456,What is your name?,Jane Smith,,,2024-01-15 14:15:00
```

### Scenario 5: Monitoring Daily Activity

**Goal**: Track how many responses are coming in each day.

**Steps**:
1. Check the "Total Responses" card for today's count
2. Compare with previous days by refreshing the page
3. Look at the "Latest Activity" to see when the last response came in

**Example Daily Monitoring**:
```
Monday: 8 responses
Tuesday: 12 responses (+50%)
Wednesday: 5 responses (-58%)
Thursday: 15 responses (+200%)
```

## Advanced Usage

### Identifying "Name" Questions

Since there's no authentication, you can identify users by their answers to name-related questions:

```typescript
// Look for common name question patterns
const nameQuestions = [
  "What is your name?",
  "Please enter your name",
  "Full name",
  "First and last name"
];

// In the sessions data, find responses to these questions
const nameResponse = session.responses.find(r => 
  nameQuestions.some(q => r.question.toLowerCase().includes(q.toLowerCase()))
);
```

### Tracking User Progress

Calculate completion rates for users:

```typescript
// Get total slides in the guide
const totalSlides = guide.slides.length;

// Get completed slides for a user
const userResponses = await fetch(`/api/admin?action=user_responses&guide_id=${guideId}&user_identifier=${userId}`);
const data = await userResponses.json();
const completedSlides = data.user_responses.length;

// Calculate progress
const progressPercentage = (completedSlides / totalSlides) * 100;
console.log(`User completed ${progressPercentage}% of the guide`);
```

### File Management

Handle file uploads effectively:

```typescript
// Get all file uploads for a guide
const responses = await fetch(`/api/admin?action=responses&guide_id=${guideId}`);
const data = await responses.json();

const fileUploads = data.responses.filter(r => r.file_url);
console.log(`Total files uploaded: ${fileUploads.length}`);

// Group by file type
const fileTypes = fileUploads.reduce((acc, file) => {
  const ext = file.file_name.split('.').pop()?.toLowerCase();
  acc[ext] = (acc[ext] || 0) + 1;
  return acc;
}, {});

console.log('File types:', fileTypes);
// Output: { pdf: 5, jpg: 3, docx: 2 }
```

## Troubleshooting

### Common Issues

**1. No responses showing up**
- Check if the guide has any interactive blocks (input-field, file-upload)
- Verify the guide ID is correct
- Check browser console for API errors

**2. Files not downloading**
- Ensure the file URLs are accessible
- Check if files are still stored in R2/Cloudflare
- Verify file permissions

**3. Search not working**
- Make sure you're searching in the correct tab
- Check if the search term matches the data format
- Try searching by partial user identifier

**4. Export failing**
- Check if there are responses to export
- Verify browser allows downloads
- Check file size limits

### Performance Tips

**1. For large datasets**
- Use the search function to narrow down results
- Export data in smaller chunks if needed
- Consider implementing pagination for very large response sets

**2. For frequent monitoring**
- Refresh the page periodically to get latest data
- Focus on the statistics cards for quick overview
- Use the "Latest Activity" to see recent responses

**3. For file management**
- Download files promptly as they may expire
- Keep track of file sizes and types
- Consider archiving old responses

## Best Practices

### 1. Regular Monitoring
- Check the admin panel daily for new responses
- Monitor the "Today's Responses" metric
- Review file uploads regularly

### 2. Data Organization
- Use consistent naming for guides
- Create meaningful question text for easy identification
- Consider adding a "Name" question early in guides for user identification

### 3. Export Strategy
- Export data regularly for backup
- Use consistent naming for exported files
- Store exports in a organized folder structure

### 4. User Experience
- Keep guides concise to encourage completion
- Use clear, specific questions
- Provide helpful instructions for file uploads

## Integration Ideas

### 1. Email Notifications
Set up webhooks to notify when new responses come in:
```typescript
// Check for new responses every hour
const lastCheck = localStorage.getItem('lastResponseCheck');
const currentTime = new Date().toISOString();

if (lastCheck) {
  const responses = await fetch(`/api/admin?action=responses&guide_id=${guideId}&after=${lastCheck}`);
  if (responses.length > 0) {
    // Send email notification
    sendNotification(`New ${responses.length} responses received`);
  }
}

localStorage.setItem('lastResponseCheck', currentTime);
```

### 2. Analytics Integration
Track response patterns over time:
```typescript
// Weekly response trends
const weeklyStats = await Promise.all(
  Array.from({length: 4}, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7));
    return fetch(`/api/admin?action=stats&guide_id=${guideId}&date=${date.toISOString()}`);
  })
);
```

### 3. Automated Reporting
Generate weekly/monthly reports:
```typescript
// Monthly summary
const monthlyReport = {
  totalResponses: stats.total_responses,
  uniqueUsers: stats.unique_users,
  completionRate: (stats.unique_users / totalGuideViews) * 100,
  topQuestions: getMostAnsweredQuestions(responses),
  fileUploads: stats.total_files
};
``` 