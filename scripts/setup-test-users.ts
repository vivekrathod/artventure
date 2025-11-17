/**
 * Setup script to create test users for E2E tests
 * Run with: npx ts-node scripts/setup-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupTestUsers() {
  console.log('🔧 Setting up test users...\n');

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'AdminPass123!';

  console.log(`Creating admin user: ${adminEmail}`);

  // Check if admin already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAdmin = existingUsers?.users.find(u => u.email === adminEmail);

  let adminUserId: string;

  if (existingAdmin) {
    console.log('✓ Admin user already exists');
    adminUserId = existingAdmin.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
      },
    });

    if (error) {
      console.error('Error creating admin user:', error);
      process.exit(1);
    }

    adminUserId = data.user!.id;
    console.log('✓ Admin user created');
  }

  // Set admin flag in profiles table
  console.log('Setting admin flag...');
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_admin: true })
    .eq('user_id', adminUserId);

  if (profileError) {
    console.error('Error setting admin flag:', profileError);
    process.exit(1);
  }

  console.log('✓ Admin flag set\n');
  console.log('✅ Test users setup complete!\n');
  console.log('Admin credentials:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
}

setupTestUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
