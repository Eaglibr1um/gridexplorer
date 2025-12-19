import { supabase } from '../config/supabase';
import { Tutee } from '../types/tuition';

/**
 * Tutee Service
 * Handles all tutee-related operations with Supabase
 */

export interface UpdateTuteeColorsInput {
  id: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorGradient?: string;
}

export interface UpdateTuteePinInput {
  id: string;
  newPin: string;
  currentPin: string; // For verification
}

export interface UpdateTuteeIconInput {
  id: string;
  icon: string;
}

export interface UpdateTuteeInfoInput {
  id: string;
  name?: string;
  description?: string;
}

export interface CreateTuteeInput {
  id: string;
  name: string;
  pin: string;
  description?: string;
  icon?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorGradient?: string;
}

/**
 * Fetch all tutees
 */
export const fetchTutees = async (): Promise<Tutee[]> => {
  try {
    const { data, error } = await supabase
      .from('tutees')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return (data || []).map((item) => ({
      id: item.id,
      name: item.name,
      pin: item.pin,
      description: item.description || undefined,
      icon: item.icon || 'BookOpen',
      colorScheme: {
        primary: item.color_primary || 'pink',
        secondary: item.color_secondary || 'purple',
        gradient: item.color_gradient || 'from-pink-500 to-purple-600',
      },
    }));
  } catch (error) {
    console.error('Error fetching tutees:', error);
    throw error;
  }
};

/**
 * Fetch a single tutee by ID
 */
export const fetchTuteeById = async (id: string): Promise<Tutee | null> => {
  try {
    const { data, error } = await supabase
      .from('tutees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error fetching tutee:', error);
    throw error;
  }
};

/**
 * Update tutee colors
 */
export const updateTuteeColors = async (
  input: UpdateTuteeColorsInput
): Promise<Tutee> => {
  try {
    const updateData: any = {};
    if (input.colorPrimary !== undefined) updateData.color_primary = input.colorPrimary;
    if (input.colorSecondary !== undefined) updateData.color_secondary = input.colorSecondary;
    if (input.colorGradient !== undefined) updateData.color_gradient = input.colorGradient;

    const { data, error } = await supabase
      .from('tutees')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error updating tutee colors:', error);
    throw error;
  }
};

/**
 * Update tutee icon
 */
export const updateTuteeIcon = async (
  input: UpdateTuteeIconInput
): Promise<Tutee> => {
  try {
    const { data, error } = await supabase
      .from('tutees')
      .update({ icon: input.icon })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error updating tutee icon:', error);
    throw error;
  }
};

/**
 * Update tutee name and/or description
 */
export const updateTuteeInfo = async (
  input: UpdateTuteeInfoInput
): Promise<Tutee> => {
  try {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    const { data, error } = await supabase
      .from('tutees')
      .update(updateData)
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error updating tutee info:', error);
    throw error;
  }
};

/**
 * Update tutee PIN
 */
export const updateTuteePin = async (
  input: UpdateTuteePinInput
): Promise<Tutee> => {
  try {
    // First verify current PIN
    const { data: tuteeData, error: fetchError } = await supabase
      .from('tutees')
      .select('pin')
      .eq('id', input.id)
      .single();

    if (fetchError) throw fetchError;

    if (tuteeData.pin !== input.currentPin) {
      throw new Error('Current PIN is incorrect');
    }

    // Validate new PIN
    if (!/^\d{4}$/.test(input.newPin)) {
      throw new Error('PIN must be exactly 4 digits');
    }

    // Update PIN
    const { data, error } = await supabase
      .from('tutees')
      .update({ pin: input.newPin })
      .eq('id', input.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error updating tutee PIN:', error);
    throw error;
  }
};

/**
 * Create a new tutee
 */
export const createTutee = async (
  input: CreateTuteeInput
): Promise<Tutee> => {
  try {
    const { data, error } = await supabase
      .from('tutees')
      .insert({
        id: input.id,
        name: input.name,
        pin: input.pin,
        description: input.description,
        icon: input.icon || 'BookOpen',
        color_primary: input.colorPrimary || 'pink',
        color_secondary: input.colorSecondary || 'purple',
        color_gradient: input.colorGradient || 'from-pink-500 to-purple-600',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      pin: data.pin,
      description: data.description || undefined,
      icon: data.icon || 'BookOpen',
      colorScheme: {
        primary: data.color_primary || 'pink',
        secondary: data.color_secondary || 'purple',
        gradient: data.color_gradient || 'from-pink-500 to-purple-600',
      },
    };
  } catch (error) {
    console.error('Error creating tutee:', error);
    throw error;
  }
};

/**
 * Delete a tutee
 */
export const deleteTutee = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tutees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting tutee:', error);
    throw error;
  }
};



