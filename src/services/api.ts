import { supabase } from './supabaseClient';
import { Habit, HabitLog, UserPreferences, DEFAULT_PREFERENCES } from '../../types';
import { INITIAL_HABITS } from '../../constants';

// ==========================================
// API LAYER FOR SUPABASE (REAL USERS ONLY)
// ==========================================

// --- USER PREFERENCES (SUPABASE OPERATIONS) ---
export const supabaseGetPreferences = async (userId: string): Promise<UserPreferences> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching preferences:', error);
      return DEFAULT_PREFERENCES;
    }

    if (!data) {
      // Create default preferences for new user
      const { data: newPrefs, error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          language: DEFAULT_PREFERENCES.language,
          gender: DEFAULT_PREFERENCES.gender,
          show_hijri: DEFAULT_PREFERENCES.showHijri,
          date_of_birth: DEFAULT_PREFERENCES.dateOfBirth,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        return DEFAULT_PREFERENCES;
      }

      return {
        language: newPrefs.language,
        gender: newPrefs.gender,
        showHijri: newPrefs.show_hijri,
        dateOfBirth: newPrefs.date_of_birth,
      };
    }

    return {
      language: data.language,
      gender: data.gender,
      showHijri: data.show_hijri,
      dateOfBirth: data.date_of_birth,
    };
  } catch (err) {
    console.error('Unexpected error in syncUserPreferences:', err);
    return DEFAULT_PREFERENCES;
  }
};

export const supabaseSavePreferences = async (
  userId: string,
  prefs: UserPreferences
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        language: prefs.language,
        gender: prefs.gender,
        show_hijri: prefs.showHijri,
        date_of_birth: prefs.dateOfBirth,
      });

    if (error) {
      console.error('Error saving preferences:', error);
    }
  } catch (err) {
    console.error('Unexpected error in saveUserPreferences:', err);
  }
};

// --- HABITS (SUPABASE OPERATIONS) ---
export const supabaseGetHabits = async (userId: string): Promise<Habit[]> => {
  try {
    console.log('📥 Fetching habits from Supabase for user:', userId);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Error fetching habits from Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      // First-time user: seed with INITIAL_HABITS
      console.log('🌱 New user detected (0 habits). Seeding INITIAL_HABITS...');
      const today = new Date().toISOString().split('T')[0]; // Seed habits start from today
      const habitsToInsert = INITIAL_HABITS.map(h => ({
        user_id: userId,
        id: h.id, // Pass preset IDs as-is (e.g., 'fajr', 'dhuhr')
        name: h.name,
        name_ar: h.nameAr,
        type: h.type,
        emoji: h.emoji,
        daily_target: h.dailyTarget,
        preset_id: h.id, // Mark as preset using the habit ID
        is_active: h.isActive !== undefined ? h.isActive : true, // Default to true if not specified
        require_reason: h.requireReason !== undefined ? h.requireReason : false, // Sync requireReason toggle
        order_index: h.order, // Frontend 'order' -> DB 'order_index'
        start_date: today, // Preset habits start from today for new users
      }));

      console.log(`🌱 Inserting ${habitsToInsert.length} initial habits...`);
      const { data: newHabits, error: insertError } = await supabase
        .from('habits')
        .insert(habitsToInsert)
        .select();

      if (insertError) {
        console.error('❌ Error seeding habits:', insertError);
        throw insertError;
      }

      console.log(`✅ Successfully seeded ${newHabits?.length || 0} habits`);
      return (newHabits || []).map(dbHabit => ({
        id: dbHabit.id,
        name: dbHabit.name,
        nameAr: dbHabit.name_ar,
        type: dbHabit.type,
        emoji: dbHabit.emoji,
        dailyTarget: dbHabit.daily_target,
        presetId: dbHabit.preset_id,
        isActive: dbHabit.is_active,
        requireReason: dbHabit.require_reason, // Sync requireReason toggle
        order: dbHabit.order_index, // DB 'order_index' -> Frontend 'order'
        startDate: dbHabit.start_date, // When habit tracking began
      }));
    }

    console.log(`✅ Fetched ${data.length} habits from Supabase`);
    return data.map(dbHabit => ({
      id: dbHabit.id,
      name: dbHabit.name,
      nameAr: dbHabit.name_ar,
      type: dbHabit.type,
      emoji: dbHabit.emoji,
      dailyTarget: dbHabit.daily_target,
      presetId: dbHabit.preset_id,
      isActive: dbHabit.is_active,
      requireReason: dbHabit.require_reason, // Sync requireReason toggle
      order: dbHabit.order_index, // DB 'order_index' -> Frontend 'order'
      startDate: dbHabit.start_date, // When habit tracking began
    }));
  } catch (err) {
    console.error('❌ Unexpected error in fetchHabits:', err);
    throw err;
  }
};

export const supabaseSaveHabit = async (userId: string, habit: Habit): Promise<void> => {
  try {
    console.log('💾 Upserting habit to Supabase:', { id: habit.id, name: habit.name, isActive: habit.isActive, requireReason: habit.requireReason, startDate: habit.startDate });
    const { error } = await supabase
      .from('habits')
      .upsert({
        user_id: userId,
        id: habit.id, // Pass ID as-is (no UUID generation for preset habits like 'fajr')
        name: habit.name,
        name_ar: habit.nameAr,
        type: habit.type,
        emoji: habit.emoji,
        daily_target: habit.dailyTarget,
        preset_id: habit.presetId,
        is_active: habit.isActive,
        require_reason: habit.requireReason, // Sync requireReason toggle
        order_index: habit.order, // Frontend 'order' -> DB 'order_index'
        start_date: habit.startDate, // When the habit tracking began
      }, {
        onConflict: 'user_id,id' // Composite primary key
      });

    if (error) {
      console.error('❌ Error saving habit to Supabase:', error);
      throw error;
    }
    console.log('✅ Habit upserted successfully to Supabase');
  } catch (err) {
    console.error('❌ Unexpected error in saveHabit:', err);
    throw err;
  }
};

// --- HABIT LOGS (SUPABASE OPERATIONS) ---
// IMPORTANT: Frontend uses 'date', DB uses 'log_date'
export const supabaseGetLogs = async (userId: string): Promise<HabitLog[]> => {
  try {
    const { data, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }

    return (data || []).map(dbLog => ({
      id: dbLog.id, // DB 'id' -> Frontend 'id'
      habitId: dbLog.habit_id,
      date: dbLog.log_date, // DB column -> Frontend property
      value: dbLog.value,
      status: dbLog.status,
      notes: dbLog.notes,
      reason: dbLog.reason, // Why was prayer missed/low quality or habit failed
      timestamp: new Date(dbLog.created_at).getTime(),
    }));
  } catch (err) {
    console.error('Unexpected error in fetchLogs:', err);
    return [];
  }
};

export const supabaseSaveLog = async (userId: string, log: HabitLog): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habit_logs')
      .upsert({
        user_id: userId,
        id: log.id,
        habit_id: log.habitId,
        log_date: log.date,
        value: log.value,
        status: log.status,
        notes: log.notes,
        reason: log.reason,
      }, {
        onConflict: 'user_id, id'
      });

    if (error) {
      console.error('❌ Error saving log to Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in saveLog:', err);
    throw err;
  }
};

export const supabaseDeleteLog = async (
  userId: string,
  habitId: string,
  date: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('log_date', date); // Use composite key columns

    if (error) {
      console.error('❌ Error deleting log from Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in deleteLog:', err);
    throw err;
  }
};

// ==========================================
// WRAPPER FUNCTIONS (MATCH STORAGE.TS INTERFACE)
// ==========================================
// These functions automatically get the user ID and match
// the localStorage function signatures for easy routing

const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
};

export const getPreferences = async (): Promise<UserPreferences> => {
  const userId = await getCurrentUserId();
  return supabaseGetPreferences(userId);
};

export const savePreferences = async (prefs: UserPreferences): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseSavePreferences(userId, prefs);
};

export const getHabits = async (): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetHabits(userId);
};

export const saveHabit = async (habit: Habit): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  console.log('🔄 API saveHabit: Starting for habit', habit.id);
  await supabaseSaveHabit(userId, habit);
  console.log('🔄 API saveHabit: Fetching updated habits list...');
  const updatedHabits = await getHabits();
  console.log(`✅ API saveHabit: Returning ${updatedHabits.length} habits`);
  return updatedHabits;
};

export const deleteHabit = async (habitId: string): Promise<Habit[]> => {
  const userId = await getCurrentUserId();
  console.log('🗑️ API deleteHabit: Deleting habit', habitId);
  
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('user_id', userId)
      .eq('id', habitId);

    if (error) {
      console.error('❌ Error deleting habit from Supabase:', error);
      throw error;
    }
    
    console.log('✅ Habit deleted from Supabase (logs cascade-deleted automatically)');
    const updatedHabits = await getHabits();
    console.log(`✅ API deleteHabit: Returning ${updatedHabits.length} habits`);
    return updatedHabits;
  } catch (err) {
    console.error('❌ Unexpected error in deleteHabit:', err);
    throw err;
  }
};

export const getLogs = async (): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetLogs(userId);
};

export const saveLog = async (log: HabitLog): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  await supabaseSaveLog(userId, log);
  return getLogs();
};

export const deleteLog = async (habitId: string, date: string): Promise<HabitLog[]> => {
  const userId = await getCurrentUserId();
  await supabaseDeleteLog(userId, habitId, date);
  return getLogs();
};

export const getLogForDate = async (habitId: string, date: string): Promise<HabitLog | undefined> => {
  const logs = await getLogs();
  return logs.find(l => l.habitId === habitId && l.date === date);
};

// ==========================================
// CUSTOM REASONS (CLOUD STORAGE)
// ==========================================

import { CustomReason } from '../../types';

export const supabaseGetCustomReasons = async (userId: string): Promise<CustomReason[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_reasons')
      .select('id, reason_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching custom reasons:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      reason_text: row.reason_text,
      createdAt: row.created_at
    }));
  } catch (err) {
    console.error('Unexpected error in fetchCustomReasons:', err);
    return [];
  }
};

export const supabaseSaveCustomReason = async (userId: string, reason: CustomReason): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_reasons')
      .upsert({
        id: reason.id,
        user_id: userId,
        reason_text: reason.reason_text.trim(),
      });

    if (error) {
      console.error('❌ Error saving custom reason to Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in saveCustomReason:', err);
    throw err;
  }
};

export const supabaseDeleteCustomReason = async (userId: string, reasonId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('custom_reasons')
      .delete()
      .eq('id', reasonId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting custom reason from Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('❌ Unexpected error in deleteCustomReason:', err);
    throw err;
  }
};

// Wrapper functions
export const getCustomReasons = async (): Promise<CustomReason[]> => {
  const userId = await getCurrentUserId();
  return supabaseGetCustomReasons(userId);
};

export const saveCustomReason = async (reason: CustomReason): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseSaveCustomReason(userId, reason);
};

export const deleteCustomReason = async (reasonId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  return supabaseDeleteCustomReason(userId, reasonId);
};

// --- BATCH UPDATE HABIT ORDER ---
export const updateHabitOrder = async (habits: Habit[]): Promise<void> => {
  const userId = await getCurrentUserId();
  console.log('📦 Batch updating habit order for', habits.length, 'habits');
  
  try {
    // Update each habit's order_index based on array position
    const updates = habits.map((habit, index) => ({
      user_id: userId,
      id: habit.id,
      name: habit.name,
      name_ar: habit.nameAr,
      type: habit.type,
      emoji: habit.emoji,
      daily_target: habit.dailyTarget,
      preset_id: habit.presetId,
      is_active: habit.isActive,
      order_index: index, // New order based on array position
      start_date: habit.startDate, // Preserve startDate
    }));

    const { error } = await supabase
      .from('habits')
      .upsert(updates, { onConflict: 'user_id,id' });

    if (error) {
      console.error('❌ Error updating habit order:', error);
      throw error;
    }
    
    console.log('✅ Habit order updated successfully');
  } catch (err) {
    console.error('❌ Unexpected error in updateHabitOrder:', err);
    throw err;
  }
};
