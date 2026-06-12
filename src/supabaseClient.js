// src/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://oysvabiwawjtyzbacpyy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95c3ZhYml3YXdqdHl6YmFjcHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDQ4NTQsImV4cCI6MjA4Nzg4MDg1NH0.wSg5gFGW8mekALL0bY2-CS1nViqVyUUJFslwz9XbULs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);