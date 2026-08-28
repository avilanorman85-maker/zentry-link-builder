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

  const res = await c.query("SELECT id, slug, title, status, blocks FROM public.pages WHERE slug = 'index-embebido-1'");
  console.log('Row found:', res.rows.length);
  if (res.rows[0]) {
    console.log('Title:', res.rows[0].title);
    console.log('Status:', res.rows[0].status);
    console.log('Blocks count:', res.rows[0].blocks?.length);
    console.log('Block 0 type:', res.rows[0].blocks?.[0]?.type);
    console.log('HTML snippet:', res.rows[0].blocks?.[0]?.data?.html?.slice(0, 1000));
  }

  await c.end();
}

main().catch(console.error);
