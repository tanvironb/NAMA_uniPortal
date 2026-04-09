import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zycysolzfzjkvwcjyyqv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY environment variable is required');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedAdmin() {
  console.log('Seeding admin users...');

  const adminUsers = [
    {
      email: 'admin@gmail.com',
      password: 'M|06xS(@59<te<',
      firstName: 'Admin',
      lastName: 'User'
    },
    {
      email: 'admin1@gmail.com',
      password: 'N@ma2025!Secure#Access',
      firstName: 'Admin',
      lastName: 'One'
    }
  ];

  try {
    for (const admin of adminUsers) {
      console.log(`Processing ${admin.email}...`);

      // First, try to create the user in auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true
      });

      if (authError && !authError.message.includes('already registered')) {
        throw authError;
      }

      let userId = authData?.user?.id;

      // If user already exists, get their ID
      if (authError?.message.includes('already registered')) {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === admin.email);
        userId = existingUser?.id;
      }

      if (!userId) {
        throw new Error(`Failed to get user ID for ${admin.email}`);
      }

      console.log(`${admin.email} created/found with ID:`, userId);

      // Upsert into admin_users for admin role
      const { error: adminUsersError } = await supabaseAdmin
        .from('admin_users')
        .upsert(
          {
            user_id: userId,
            email: admin.email,
            role: 'admin',
          },
          { onConflict: 'user_id' }
        );

      if (adminUsersError) {
        throw adminUsersError;
      }

      // Create or update profile (optional, keeps app consistent)
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: userId,
            email: admin.email,
            first_name: admin.firstName,
            last_name: admin.lastName,
            nationality: 'System',
            gender: 'Male',
            role: 'admin',
            status: 'approved',
          },
          {
            onConflict: 'id',
          }
        );

      if (profileError) {
        throw profileError;
      }

      console.log(`${admin.email} profile created/updated successfully`);
    }

    console.log('\n✓ All admin users seeded successfully');
    console.log('\nAdmin credentials:');
    console.log('1. Email: admin@gmail.com');
    console.log('   Password: M|06xS(@59<te<');
    console.log('2. Email: admin1@gmail.com');
    console.log('   Password: N@ma2025!Secure#Access');

  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();