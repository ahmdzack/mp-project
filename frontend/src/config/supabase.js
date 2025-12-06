import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not configured. Phone verification will be disabled.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Send phone verification OTP
export const sendPhoneOTP = async (phone) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Send phone OTP error:', error);
    throw error;
  }
};

// Verify phone OTP
export const verifyPhoneOTP = async (phone, token) => {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    throw error;
  }
};
