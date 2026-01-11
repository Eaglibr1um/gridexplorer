import { supabase } from '../config/supabase';

export interface WorkProgressSection {
  id: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkProgressTask {
  id: string;
  sectionId: string;
  name: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkProgressDailyEntry {
  id: string;
  entryDate: string;
  notes?: string;
  moodEmoji?: string;
  notificationsEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkProgressTaskEntry {
  id: string;
  dailyEntryId: string;
  taskId: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyEntryWithTasks extends WorkProgressDailyEntry {
  taskEntries: Array<WorkProgressTaskEntry & { task: WorkProgressTask }>;
}

// Sections
export const fetchSections = async (): Promise<WorkProgressSection[]> => {
  const { data, error } = await supabase
    .from('work_progress_sections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const createSection = async (name: string, displayOrder?: number): Promise<WorkProgressSection> => {
  const { data, error } = await supabase
    .from('work_progress_sections')
    .insert({
      name,
      display_order: displayOrder ?? 0
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateSection = async (id: string, updates: { name?: string; displayOrder?: number }): Promise<WorkProgressSection> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

  const { data, error } = await supabase
    .from('work_progress_sections')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const deleteSection = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('work_progress_sections')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Tasks
export const fetchTasks = async (sectionId?: string): Promise<WorkProgressTask[]> => {
  let query = supabase
    .from('work_progress_tasks')
    .select('*');

  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }

  const { data, error } = await query.order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    sectionId: row.section_id,
    name: row.name,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const createTask = async (sectionId: string, name: string, displayOrder?: number): Promise<WorkProgressTask> => {
  const { data, error } = await supabase
    .from('work_progress_tasks')
    .insert({
      section_id: sectionId,
      name,
      display_order: displayOrder ?? 0
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    sectionId: data.section_id,
    name: data.name,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateTask = async (id: string, updates: { name?: string; sectionId?: string; displayOrder?: number }): Promise<WorkProgressTask> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.sectionId !== undefined) updateData.section_id = updates.sectionId;
  if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

  const { data, error } = await supabase
    .from('work_progress_tasks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    sectionId: data.section_id,
    name: data.name,
    displayOrder: data.display_order,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const deleteTask = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('work_progress_tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Helper to check if entry has any tasks with count > 0
export const hasTasksWithCount = (entry: DailyEntryWithTasks): boolean => {
  return entry.taskEntries.some(te => te.count > 0);
};

// Helper to check if entry counts toward streak (tasks with count > 0 OR mood set)
export const countsTowardStreak = (entry: DailyEntryWithTasks): boolean => {
  const hasTasks = entry.taskEntries.some(te => te.count > 0);
  const hasMood = entry.moodEmoji !== null && entry.moodEmoji !== undefined && entry.moodEmoji !== '';
  return hasTasks || hasMood;
};

// Calculate streak (consecutive days with tasks count > 0 OR mood emoji set)
export const calculateStreak = async (): Promise<{ current: number; longest: number }> => {
  // Get all daily entries with their task entries
  const { data, error } = await supabase
    .from('work_progress_daily_entries')
    .select(`
      entry_date,
      mood_emoji,
      work_progress_task_entries(count)
    `)
    .order('entry_date', { ascending: false });

  if (error || !data || data.length === 0) return { current: 0, longest: 0 };

  // Filter to only include days that have:
  // 1. At least one task with count > 0, OR
  // 2. A mood emoji set (for days without work but with mood logging)
  const validEntries = data.filter(entry => {
    const hasTasks = entry.work_progress_task_entries?.some((te: { count: number }) => te.count > 0);
    const hasMood = entry.mood_emoji !== null && entry.mood_emoji !== '';
    return hasTasks || hasMood;
  });

  if (validEntries.length === 0) return { current: 0, longest: 0 };

  // Get unique dates and sort descending
  const uniqueDates = Array.from(new Set(validEntries.map(entry => entry.entry_date)))
    .sort((a, b) => b.localeCompare(a)); // Sort dates as strings (YYYY-MM-DD format)

  if (uniqueDates.length === 0) return { current: 0, longest: 0 };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Check if streak is current (must start today or yesterday)
  const mostRecentDate = uniqueDates[0];
  const isCurrentStreak = mostRecentDate === todayStr || mostRecentDate === yesterdayStr;

  if (!isCurrentStreak) {
    // No current streak, but still calculate longest
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i - 1]);
        const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    return { current: 0, longest: longestStreak };
  }

  // Calculate current streak (stop at first gap)
  currentStreak = 1; // Start with the most recent day
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i - 1]);
    const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak++;
    } else {
      // Gap found - stop counting current streak
      break;
    }
  }

  // Calculate longest streak by going through all dates
  tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i - 1]);
    const diffDays = Math.round((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { current: currentStreak, longest: longestStreak };
};

// Daily Entries
export const fetchDailyEntries = async (startDate?: string, endDate?: string): Promise<DailyEntryWithTasks[]> => {
  let query = supabase
    .from('work_progress_daily_entries')
    .select(`
      *,
      task_entries:work_progress_task_entries(
        *,
        task:work_progress_tasks(*)
      )
    `);

  if (startDate) {
    query = query.gte('entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('entry_date', endDate);
  }

  const { data, error } = await query.order('entry_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    entryDate: row.entry_date,
    notes: row.notes,
    moodEmoji: row.mood_emoji,
    notificationsEnabled: row.notifications_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    taskEntries: (row.task_entries || []).map((te: any) => ({
      id: te.id,
      dailyEntryId: te.daily_entry_id,
      taskId: te.task_id,
      count: te.count,
      createdAt: te.created_at,
      updatedAt: te.updated_at,
      task: {
        id: te.task.id,
        sectionId: te.task.section_id,
        name: te.task.name,
        displayOrder: te.task.display_order,
        createdAt: te.task.created_at,
        updatedAt: te.task.updated_at
      }
    }))
  }));
};

export const getDailyEntry = async (date: string): Promise<DailyEntryWithTasks | null> => {
  const { data, error } = await supabase
    .from('work_progress_daily_entries')
    .select(`
      *,
      task_entries:work_progress_task_entries(
        *,
        task:work_progress_tasks(*)
      )
    `)
    .eq('entry_date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return {
    id: data.id,
    entryDate: data.entry_date,
    notes: data.notes,
    moodEmoji: data.mood_emoji,
    notificationsEnabled: data.notifications_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    taskEntries: (data.task_entries || []).map((te: any) => ({
      id: te.id,
      dailyEntryId: te.daily_entry_id,
      taskId: te.task_id,
      count: te.count,
      createdAt: te.created_at,
      updatedAt: te.updated_at,
      task: {
        id: te.task.id,
        sectionId: te.task.section_id,
        name: te.task.name,
        displayOrder: te.task.display_order,
        createdAt: te.task.created_at,
        updatedAt: te.task.updated_at
      }
    }))
  };
};

export const createOrUpdateDailyEntry = async (
  date: string,
  updates: { notes?: string; moodEmoji?: string; notificationsEnabled?: boolean }
): Promise<WorkProgressDailyEntry> => {
  // Try to get existing entry
  const existing = await getDailyEntry(date);

  if (existing) {
    // Update existing
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.moodEmoji !== undefined) updateData.mood_emoji = updates.moodEmoji;
    if (updates.notificationsEnabled !== undefined) updateData.notifications_enabled = updates.notificationsEnabled;

    const { data, error } = await supabase
      .from('work_progress_daily_entries')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      entryDate: data.entry_date,
      notes: data.notes,
      moodEmoji: data.mood_emoji,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } else {
    // Create new
    const { data, error } = await supabase
      .from('work_progress_daily_entries')
      .insert({
        entry_date: date,
        notes: updates.notes,
        mood_emoji: updates.moodEmoji,
        notifications_enabled: updates.notificationsEnabled
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      entryDate: data.entry_date,
      notes: data.notes,
      moodEmoji: data.mood_emoji,
      notificationsEnabled: data.notifications_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
};

export const updateTaskEntryCount = async (
  dailyEntryId: string,
  taskId: string,
  count: number
): Promise<WorkProgressTaskEntry> => {
  // Check if entry exists
  const { data: existing } = await supabase
    .from('work_progress_task_entries')
    .select('*')
    .eq('daily_entry_id', dailyEntryId)
    .eq('task_id', taskId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('work_progress_task_entries')
      .update({
        count,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      dailyEntryId: data.daily_entry_id,
      taskId: data.task_id,
      count: data.count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } else {
    // Create new
    const { data, error } = await supabase
      .from('work_progress_task_entries')
      .insert({
        daily_entry_id: dailyEntryId,
        task_id: taskId,
        count
      })
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      dailyEntryId: data.daily_entry_id,
      taskId: data.task_id,
      count: data.count,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
};

// Notification subscription functions
export const subscribeWorkProgressNotifications = async (subscription: any): Promise<void> => {
  // Get device fingerprint (simple version)
  const deviceFingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent.substring(0, 50)}`;
  
  const { error } = await supabase
    .from('work_progress_notifications')
    .upsert({
      device_fingerprint: deviceFingerprint,
      subscription,
      is_enabled: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'device_fingerprint'
    });

  if (error) throw error;
};

export const unsubscribeWorkProgressNotifications = async (): Promise<void> => {
  const deviceFingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent.substring(0, 50)}`;
  
  const { error } = await supabase
    .from('work_progress_notifications')
    .update({ is_enabled: false })
    .eq('device_fingerprint', deviceFingerprint);

  if (error) throw error;
};

export const isWorkProgressNotificationsEnabled = async (): Promise<boolean> => {
  const deviceFingerprint = `${window.screen.width}x${window.screen.height}-${navigator.userAgent.substring(0, 50)}`;
  
  const { data, error } = await supabase
    .from('work_progress_notifications')
    .select('is_enabled')
    .eq('device_fingerprint', deviceFingerprint)
    .single();

  if (error || !data) return false;
  return data.is_enabled;
};


