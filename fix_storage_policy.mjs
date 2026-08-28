import pg from 'pg';

const { Client } = pg;

async function main() {
  const c = new Client({
    host: 'aws-0-us-east-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.efydortqxworusxwubsb',
    password: 'Jose1998@lopez1',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await c.connect();

  await c.query(`
    DROP POLICY IF EXISTS "Public Insert page-assets" ON storage.objects;
    CREATE POLICY "Public Insert page-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'page-assets');
    DROP POLICY IF EXISTS "Public Update page-assets" ON storage.objects;
    CREATE POLICY "Public Update page-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'page-assets');
    DROP POLICY IF EXISTS "Public Select page-assets" ON storage.objects;
    CREATE POLICY "Public Select page-assets" ON storage.objects FOR SELECT USING (bucket_id = 'page-assets');
  `);
  console.log('Storage RLS policies successfully applied!');

  await c.end();
}

main().catch(console.error);
