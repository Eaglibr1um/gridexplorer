import { supabase } from '../config/supabase';

export interface WorksheetEntry {
  id: string;
  tuteeId: string;
  worksheetName: string;
  studentName: string;
  completedDate: string;
  status: 'Upcoming' | 'In Progress' | 'Completed';
  completionPercentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorksheetInput {
  tuteeId: string;
  worksheetName: string;
  studentName: string;
  completedDate: string;
  status?: 'Upcoming' | 'In Progress' | 'Completed';
  completionPercentage?: number;
  notes?: string;
}

export const fetchWorksheets = async (tuteeId: string): Promise<WorksheetEntry[]> => {
  const { data, error } = await supabase
    .from('worksheets')
    .select('*')
    .eq('tutee_id', tuteeId)
    .order('completed_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    tuteeId: row.tutee_id,
    worksheetName: row.worksheet_name,
    studentName: row.student_name,
    completedDate: row.completed_date,
    status: row.status,
    completionPercentage: row.completion_percentage,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
};

export const createWorksheet = async (input: CreateWorksheetInput): Promise<WorksheetEntry> => {
  const { data, error } = await supabase
    .from('worksheets')
    .insert({
      tutee_id: input.tuteeId,
      worksheet_name: input.worksheetName,
      student_name: input.studentName,
      completed_date: input.completedDate,
      status: input.status || 'Upcoming',
      completion_percentage: input.completionPercentage || 0,
      notes: input.notes
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    tuteeId: data.tutee_id,
    worksheetName: data.worksheet_name,
    studentName: data.student_name,
    completedDate: data.completed_date,
    status: data.status,
    completionPercentage: data.completion_percentage,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateWorksheet = async (id: string, input: Partial<CreateWorksheetInput>): Promise<WorksheetEntry> => {
  const updateData: any = {
    updated_at: new Date().toISOString()
  };
  if (input.worksheetName !== undefined) updateData.worksheet_name = input.worksheetName;
  if (input.studentName !== undefined) updateData.student_name = input.studentName;
  if (input.completedDate !== undefined) updateData.completed_date = input.completedDate;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.completionPercentage !== undefined) updateData.completion_percentage = input.completionPercentage;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from('worksheets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    tuteeId: data.tutee_id,
    worksheetName: data.worksheet_name,
    studentName: data.student_name,
    completedDate: data.completed_date,
    status: data.status,
    completionPercentage: data.completion_percentage,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const deleteWorksheet = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('worksheets')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
