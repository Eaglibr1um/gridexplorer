/**
 * Script to import existing work progress data
 * Run this in the browser console or as a one-time migration
 */

import {
  createSection,
  createTask,
  createOrUpdateDailyEntry,
  updateTaskEntryCount,
  fetchSections,
  fetchTasks
} from '../services/workProgressService';

// Existing tasks from user's data
const INITIAL_TASKS = [
  'Global News',
  'Local News',
  'Malaysia News',
  'Life Panels',
  'Ads Copy',
  'Tiktok Reels',
  'Insta FB Post'
];

// Sample data structure (you'll need to parse your actual data)
const SAMPLE_ENTRIES = [
  {
    date: '2025-11-07',
    tasks: {
      'Global News': 14
    },
    notes: 'Working on first 美得好',
    photoUrl: null // You'll need to upload photos separately
  },
  {
    date: '2025-11-09',
    tasks: {
      'Global News': 14,
      'Tiktok Reels': 1
    },
    notes: "Didn't get rushed by 姐姐 even though it was past 1pm… surprise surprise haha then talked about reno stuff with 淑美 and 婉雯 over lunch :)"
  },
  // Add more entries from your data...
];

export const importInitialData = async () => {
  try {
    console.log('Starting data import...');

    // 1. Create a default section
    const section = await createSection('Daily Tasks', 0);
    console.log('Created section:', section.name);

    // 2. Create all tasks
    const taskMap: Record<string, string> = {};
    for (let i = 0; i < INITIAL_TASKS.length; i++) {
      const task = await createTask(section.id, INITIAL_TASKS[i], i);
      taskMap[INITIAL_TASKS[i]] = task.id;
      console.log('Created task:', task.name);
    }

    // 3. Import daily entries
    for (const entry of SAMPLE_ENTRIES) {
      const dailyEntry = await createOrUpdateDailyEntry(entry.date, {
        notes: entry.notes || undefined,
        photoUrl: entry.photoUrl || undefined
      });

      // Add task entries
      for (const [taskName, count] of Object.entries(entry.tasks)) {
        if (taskMap[taskName]) {
          await updateTaskEntryCount(dailyEntry.id, taskMap[taskName], count);
        }
      }

      console.log('Imported entry for:', entry.date);
    }

    console.log('Data import completed!');
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

// Helper function to parse your CSV/Excel data
export const parseDataFromTable = (tableData: string) => {
  // This is a placeholder - you'll need to implement CSV parsing
  // or manually convert your data to the SAMPLE_ENTRIES format
  return [];
};

