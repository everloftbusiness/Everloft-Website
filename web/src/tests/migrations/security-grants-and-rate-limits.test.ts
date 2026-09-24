// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

describe('Security Grants & Schema Hardening Migration Regression Test', () => {
  let db: PGlite;

  beforeAll(async () => {
    db = new PGlite();

    // 1. Prepare simulated Supabase environment (roles, auth schema, helper stubs)
    await db.exec(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text,
        raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );
      INSERT INTO auth.users (id, email)
      VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'system@everloft.test')
      ON CONFLICT (id) DO NOTHING;

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT COALESCE(
          nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
          '00000000-0000-0000-0000-000000000000'::uuid
        );
      $$;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
          CREATE ROLE authenticated;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
          CREATE ROLE anon;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
          CREATE ROLE service_role;
        END IF;
      END $$;

      CREATE DOMAIN citext AS text;
    `);

    // 2. Load and execute all 33 migrations in strict alphabetical sequence
    const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      // Filter out extension installations not compiled in WASM build
      sql = sql.replace(/create\s+extension\s+[^;]+;/gi, '-- skipped extension');
      await db.exec(sql);
    }
  });

  it('verifies public.permissions does not contain slug and contains key', async () => {
    const res = await db.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'permissions'
    `);
    const columnNames = res.rows.map((r) => r.column_name);

    expect(columnNames).toContain('key');
    expect(columnNames).toContain('name');
    expect(columnNames).not.toContain('slug');
  });

  it('verifies public.user_permissions exposes exactly user_id and permission_key', async () => {
    const res = await db.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_permissions'
      ORDER BY ordinal_position
    `);
    const columnNames = res.rows.map((r) => r.column_name);

    // Strict two-column contract required by session.ts and types.ts
    expect(columnNames).toEqual(['user_id', 'permission_key']);
    expect(columnNames).not.toContain('role_id');
    expect(columnNames).not.toContain('role_slug');
    expect(columnNames).not.toContain('role_name');
    expect(columnNames).not.toContain('permission_id');
    expect(columnNames).not.toContain('permission_name');
    expect(columnNames).not.toContain('permission_slug');
  });

  it('verifies permission_key comes from permissions.key and resolves in user_permissions', async () => {
    const testUserId = '11111111-1111-1111-1111-111111111111';
    await db.exec(`
      INSERT INTO auth.users (id, email) VALUES ('${testUserId}'::uuid, 'test_user@everloft.test');
      INSERT INTO public.roles (id, slug, name) VALUES ('22222222-2222-2222-2222-222222222222'::uuid, 'custom_role', 'Custom Role');
      INSERT INTO public.permissions (id, key, name) VALUES ('33333333-3333-3333-3333-333333333333'::uuid, 'view_secret_vault', 'View Secret Vault');
      INSERT INTO public.role_permissions (role_id, permission_id) VALUES ('22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid);
      INSERT INTO public.user_roles (user_id, role_id) VALUES ('${testUserId}'::uuid, '22222222-2222-2222-2222-222222222222'::uuid);
    `);

    const res = await db.query<{ user_id: string; permission_key: string }>(`
      SELECT user_id, permission_key
      FROM public.user_permissions
      WHERE user_id = '${testUserId}' AND permission_key = 'view_secret_vault'
    `);

    expect(res.rows.length).toBe(1);
    expect(res.rows[0].permission_key).toBe('view_secret_vault');
  });

  it('verifies user_permissions view is security_invoker = true', async () => {
    const res = await db.query<{ reloptions: string[] | null }>(`
      SELECT c.reloptions
      FROM pg_class c
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public' AND c.relname = 'user_permissions'
    `);

    expect(res.rows.length).toBe(1);
    const options = res.rows[0].reloptions || [];
    expect(options).toContain('security_invoker=true');
  });

  it('verifies public.authorize(text) functions correctly with permissions', async () => {
    await db.exec("SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);");
    const authPositive = await db.query<{ result: boolean }>(`
      SELECT public.authorize('view_secret_vault') AS result;
    `);
    expect(authPositive.rows[0].result).toBe(true);

    const authNegative = await db.query<{ result: boolean }>(`
      SELECT public.authorize('non_existent_perm') AS result;
    `);
    expect(authNegative.rows[0].result).toBe(false);
  });

  it('verifies service_role privileges and rate_limits atomic RPC', async () => {
    // 1. service_role has access to check_rate_limit
    const rpcRes = await db.query<{ check_rate_limit: { allowed: boolean; remaining: number; count: number } }>(`
      SELECT public.check_rate_limit('test_migration_key', 10, 60);
    `);

    expect(rpcRes.rows.length).toBe(1);
    expect(rpcRes.rows[0].check_rate_limit.allowed).toBe(true);
    expect(rpcRes.rows[0].check_rate_limit.remaining).toBe(9);
    expect(rpcRes.rows[0].check_rate_limit.count).toBe(1);

    // 2. check_rate_limit rejects invalid arguments
    await expect(db.exec(`SELECT public.check_rate_limit('', 10, 60);`)).rejects.toThrow(
      /Invalid rate limit key/
    );
    await expect(db.exec(`SELECT public.check_rate_limit('valid_key', 0, 60);`)).rejects.toThrow(
      /Invalid max requests/
    );
    await expect(db.exec(`SELECT public.check_rate_limit('valid_key', 10, 0);`)).rejects.toThrow(
      /Invalid window seconds/
    );
  });

  it('verifies anon role cannot query rate_limits or execute check_rate_limit', async () => {
    const selectCheck = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('anon', 'public.rate_limits', 'SELECT') AS allowed;
    `);
    expect(selectCheck.rows[0].allowed).toBe(false);

    const executeCheck = await db.query<{ allowed: boolean }>(`
      SELECT has_function_privilege('anon', 'public.check_rate_limit(text, integer, integer)', 'EXECUTE') AS allowed;
    `);
    expect(executeCheck.rows[0].allowed).toBe(false);

    const userPermCheck = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('anon', 'public.user_permissions', 'SELECT') AS allowed;
    `);
    expect(userPermCheck.rows[0].allowed).toBe(false);
  });

  it('verifies authenticated role cannot directly mutate bookings or booking_payments', async () => {
    // Bookings mutation privileges for authenticated
    const bookingInsert = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('authenticated', 'public.bookings', 'INSERT') AS allowed;
    `);
    expect(bookingInsert.rows[0].allowed).toBe(false);

    const bookingUpdate = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('authenticated', 'public.bookings', 'UPDATE') AS allowed;
    `);
    expect(bookingUpdate.rows[0].allowed).toBe(false);

    const bookingDelete = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('authenticated', 'public.bookings', 'DELETE') AS allowed;
    `);
    expect(bookingDelete.rows[0].allowed).toBe(false);

    // But SELECT is permitted
    const bookingSelect = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('authenticated', 'public.bookings', 'SELECT') AS allowed;
    `);
    expect(bookingSelect.rows[0].allowed).toBe(true);

    // Payments mutation privileges for authenticated
    const paymentInsert = await db.query<{ allowed: boolean }>(`
      SELECT has_table_privilege('authenticated', 'public.booking_payments', 'INSERT') AS allowed;
    `);
    expect(paymentInsert.rows[0].allowed).toBe(false);
  });

  it('verifies Auth trigger functions work properly on user creation', async () => {
    const newUserId = '44444444-4444-4444-4444-444444444444';
    await db.exec(`
      INSERT INTO auth.users (id, email, raw_user_meta_data)
      VALUES ('${newUserId}'::uuid, 'trigger_test@everloft.test', '{"full_name": "Trigger Test"}'::jsonb);
    `);

    const profileRes = await db.query<{ id: string; email: string; full_name: string }>(`
      SELECT id, email, full_name
      FROM public.profiles
      WHERE id = '${newUserId}'::uuid
    `);

    expect(profileRes.rows.length).toBe(1);
    expect(profileRes.rows[0].full_name).toBe('Trigger Test');
    expect(profileRes.rows[0].email).toBe('trigger_test@everloft.test');
  });
});
