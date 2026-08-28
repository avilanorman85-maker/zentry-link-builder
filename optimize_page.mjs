import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const SUPABASE_URL = 'https://efydortqxworusxwubsb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Qm3rw9onqv9ugF40g6qUGA_sUhSvkH1';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  const res = await c.query("SELECT id, slug, title, length(blocks::text) as size_bytes, blocks FROM public.pages WHERE slug = 'index-receta-embebido'");
  console.log('Page row:', { id: res.rows[0]?.id, slug: res.rows[0]?.slug, size: res.rows[0]?.size_bytes });

  if (res.rows.length > 0 && res.rows[0].blocks) {
    let blocks = res.rows[0].blocks;
    let modified = false;

    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'html' && blocks[i].data?.html) {
        let html = blocks[i].data.html;
        console.log('HTML block length:', html.length);

        // Find heavy base64 images
        const b64Regex = /src=["'](data:image\/([a-zA-Z]+);base64,([^"']+))["']/g;
        let match;
        const replacements = [];

        while ((match = b64Regex.exec(html)) !== null) {
          const fullDataUrl = match[1];
          const ext = match[2] || 'png';
          const b64Data = match[3];

          if (b64Data.length > 1000) { // greater than 1KB
            console.log(`Found heavy base64 image (${Math.round(b64Data.length / 1024)} KB)`);
            const buffer = Buffer.from(b64Data, 'base64');
            const fileName = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('page-assets')
              .upload(fileName, buffer, {
                contentType: `image/${ext}`,
                upsert: true
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
            } else {
              const { data: urlData } = supabase.storage
                .from('page-assets')
                .getPublicUrl(fileName);

              console.log('Uploaded to CDN:', urlData.publicUrl);
              replacements.push({ from: fullDataUrl, to: urlData.publicUrl });
            }
          }
        }

        for (const rep of replacements) {
          html = html.replaceAll(rep.from, rep.to);
          modified = true;
        }

        blocks[i].data.html = html;
      }
    }

    if (modified) {
      await c.query("UPDATE public.pages SET blocks = $1 WHERE id = $2", [JSON.stringify(blocks), res.rows[0].id]);
      console.log('Successfully updated page in DB with optimized image URLs!');
    }
  }

  await c.end();
}

main().catch(console.error);
