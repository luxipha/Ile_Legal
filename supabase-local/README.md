# Supabase Setup Instructions

## Applying Messaging Tables Migration

Since we're having issues with the CLI authentication, follow these steps to apply the messaging tables migration manually:

1. **Access the Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Login with your account
   - Select your project (the one with reference ID: pleuwhgjpjnkqvbemmhl)

2. **Run the SQL Migration**:
   - In the dashboard, go to the "SQL Editor" section
   - Create a new query
   - Copy and paste the contents of the migration file:
     `/Users/abisoye/Projects/Ile-MVP/ile-legal/supabase/migrations/20250614_add_messaging_tables.sql`
   - Run the SQL commands

3. **Verify the Tables**:
   - After running the migration, go to the "Table Editor" section
   - Check if the `conversations` and `messages` tables were created successfully

## Testing the Connection

After applying the migration, you can test the connection with this command:

```bash
npx tsx src/tests/supabaseSimpleTest.ts
```

This will check if the tables exist and are accessible.

## Troubleshooting

If you continue to have issues with the Supabase CLI, you may need to:

1. Reset your database password from the Supabase dashboard
2. Update your local environment variables with the new credentials
3. Try linking the project again with `supabase link --project-ref pleuwhgjpjnkqvbemmhl`
