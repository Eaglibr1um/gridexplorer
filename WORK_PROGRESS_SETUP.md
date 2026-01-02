# Work Progress Tracker Setup Guide

## Overview
The Work Progress Tracker is a mobile-first application for tracking daily work tasks with calendar view, photo uploads, and notes.

## Database Setup
The database tables have been created automatically via migration. The following tables exist:
- `work_progress_sections` - Stores task sections
- `work_progress_tasks` - Stores individual tasks
- `work_progress_daily_entries` - Stores daily entries with notes and photos
- `work_progress_task_entries` - Links tasks to daily entries with counts

## Storage Bucket Setup
To enable photo uploads, you need to create a storage bucket in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Storage
3. Create a new bucket named: `work-progress-photos`
4. Set it to **Public** (or configure RLS policies as needed)
5. The bucket will automatically be used for photo uploads

## Importing Existing Data

### Option 1: Using Browser Console
1. Navigate to `/work-progress` in your app
2. Open browser console (F12)
3. Run: `await window.importWorkProgressData()`

### Option 2: Programmatically
Import the function and call it:
```typescript
import { importWorkProgressData } from './utils/importWorkProgressData';
await importWorkProgressData();
```

The import script will:
- Create a "Daily Tasks" section
- Create all 7 initial tasks (Global News, Local News, etc.)
- Import all historical entries with dates, task counts, and notes

## Features

### Mobile-First Design
- Optimized for mobile devices
- Touch-friendly buttons and interactions
- Responsive calendar view

### Calendar View
- Navigate between months
- Click any date to view/edit that day's entries
- Visual indicators for today and selected date

### Task Management
- Create sections to group related tasks
- Add/remove tasks within sections
- Edit task names
- Delete tasks and sections

### Daily Tracking
- Quick increment/decrement buttons for each task
- Large, satisfying number displays
- Real-time updates to database

### Photo of the Day
- Upload photos for each day
- View photos in modal
- Photos stored in Supabase Storage

### Notes
- Add daily notes
- Rich text support
- Auto-save functionality

## Usage

### Accessing the Tracker
Navigate to `/work-progress` in your app (requires authentication).

### Adding a Section
1. Click "Add Section" button at the bottom
2. Enter section name
3. Click "Create"

### Adding a Task
1. Click the "+" button in a section header
2. Select the section (if creating new task)
3. Enter task name
4. Click "Create"

### Recording Daily Progress
1. Select a date using the date picker or calendar
2. Use +/- buttons to adjust task counts
3. Click camera icon to add photo
4. Click notes icon to add/edit notes

### Viewing Calendar
1. Click the calendar icon in the header
2. Navigate months using arrow buttons
3. Click any date to view that day's entries

## Data Structure

### Sections
- Group related tasks together
- Can be renamed or deleted
- Display order can be customized

### Tasks
- Belong to a section
- Tracked daily with counts
- Can be moved between sections

### Daily Entries
- One entry per date
- Contains notes and photo URL
- Links to task entries with counts

## Troubleshooting

### Photos Not Uploading
- Ensure the `work-progress-photos` bucket exists in Supabase Storage
- Check bucket permissions (should be public or have proper RLS policies)
- Check browser console for error messages

### Data Not Loading
- Check Supabase connection
- Verify RLS policies allow read access
- Check browser console for errors

### Import Fails
- Ensure you're authenticated
- Check that database tables exist
- Verify RLS policies allow insert/update operations

## Future Enhancements
- Export data to CSV/Excel
- Statistics and charts
- Task templates
- Recurring tasks
- Task categories/tags
- Search functionality

