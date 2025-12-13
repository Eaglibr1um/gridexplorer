import { supabase } from '../config/supabase';

/**
 * Component Service
 * Handles dashboard component operations
 */

export interface DashboardComponent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  componentType: string;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TuteeComponent {
  id: string;
  tuteeId: string;
  componentId: string;
  displayOrder: number;
  isActive: boolean;
  config: Record<string, any>;
  component?: DashboardComponent;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPoint {
  id: string;
  tuteeId: string;
  sessionDate: string; // ISO date string
  points: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all dashboard components
 */
export const fetchDashboardComponents = async (): Promise<DashboardComponent[]> => {
  try {
    const { data, error } = await supabase
      .from('dashboard_components')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      displayName: item.display_name,
      description: item.description || undefined,
      componentType: item.component_type,
      config: item.config || {},
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching dashboard components:', error);
    throw error;
  }
};

/**
 * Fetch components assigned to a tutee
 */
export const fetchTuteeComponents = async (tuteeId: string): Promise<TuteeComponent[]> => {
  try {
    const { data, error } = await supabase
      .from('tutee_components')
      .select(`
        *,
        component:dashboard_components(*)
      `)
      .eq('tutee_id', tuteeId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      componentId: item.component_id,
      displayOrder: item.display_order,
      isActive: item.is_active,
      config: item.config || {},
      component: item.component ? {
        id: item.component.id,
        name: item.component.name,
        displayName: item.component.display_name,
        description: item.component.description,
        componentType: item.component.component_type,
        config: item.component.config || {},
        createdAt: item.component.created_at,
        updatedAt: item.component.updated_at,
      } : undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching tutee components:', error);
    throw error;
  }
};

/**
 * Assign a component to a tutee
 */
export const assignComponentToTutee = async (
  tuteeId: string,
  componentId: string,
  displayOrder?: number,
  config?: Record<string, any>
): Promise<TuteeComponent> => {
  try {
    const { data, error } = await supabase
      .from('tutee_components')
      .insert({
        tutee_id: tuteeId,
        component_id: componentId,
        display_order: displayOrder || 0,
        is_active: true,
        config: config || {},
      })
      .select(`
        *,
        component:dashboard_components(*)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      componentId: data.component_id,
      displayOrder: data.display_order,
      isActive: data.is_active,
      config: data.config || {},
      component: data.component ? {
        id: data.component.id,
        name: data.component.name,
        displayName: data.component.display_name,
        description: data.component.description,
        componentType: data.component.component_type,
        config: data.component.config || {},
        createdAt: data.component.created_at,
        updatedAt: data.component.updated_at,
      } : undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error assigning component to tutee:', error);
    throw error;
  }
};

/**
 * Remove a component from a tutee
 */
export const removeComponentFromTutee = async (
  tuteeComponentId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tutee_components')
      .delete()
      .eq('id', tuteeComponentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing component from tutee:', error);
    throw error;
  }
};

/**
 * Fetch learning points for a tutee
 */
export const fetchLearningPoints = async (tuteeId: string): Promise<LearningPoint[]> => {
  try {
    const { data, error } = await supabase
      .from('learning_points')
      .select('*')
      .eq('tutee_id', tuteeId)
      .order('session_date', { ascending: false });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      tuteeId: item.tutee_id,
      sessionDate: item.session_date,
      points: item.points,
      tags: item.tags || [],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching learning points:', error);
    throw error;
  }
};

/**
 * Create a learning point
 */
export const createLearningPoint = async (
  tuteeId: string,
  sessionDate: string,
  points: string,
  tags?: string[]
): Promise<LearningPoint> => {
  try {
    const { data, error } = await supabase
      .from('learning_points')
      .insert({
        tutee_id: tuteeId,
        session_date: sessionDate,
        points,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      sessionDate: data.session_date,
      points: data.points,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error creating learning point:', error);
    throw error;
  }
};

/**
 * Update a learning point
 */
export const updateLearningPoint = async (
  id: string,
  updates: {
    sessionDate?: string;
    points?: string;
    tags?: string[];
  }
): Promise<LearningPoint> => {
  try {
    const updateData: any = {};
    if (updates.sessionDate !== undefined) updateData.session_date = updates.sessionDate;
    if (updates.points !== undefined) updateData.points = updates.points;
    if (updates.tags !== undefined) updateData.tags = updates.tags;

    const { data, error } = await supabase
      .from('learning_points')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tuteeId: data.tutee_id,
      sessionDate: data.session_date,
      points: data.points,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('Error updating learning point:', error);
    throw error;
  }
};

/**
 * Delete a learning point
 */
export const deleteLearningPoint = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('learning_points')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting learning point:', error);
    throw error;
  }
};

