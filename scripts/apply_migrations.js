/* eslint-disable no-console */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DB_URL = process.env.SUPABASE_DB_URL;
if (!DB_URL) { console.error('SUPABASE_DB_URL missing from .env.local'); process.exit(2); }

const FILES = process.argv.slice(2);
if (FILES.length === 0) { console.error('usage: node scripts/apply_migrations.js <file.sql> [file2.sql ...]'); process.exit(2); }

(async () => {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const ident = await client.query(`select current_database() as db, current_user as usr,
    (select jsonb_object_agg(table_name, true) from information_schema.tables where table_schema='public') as tables`);
  console.log('Connected to:', ident.rows[0].db, 'as', ident.rows[0].usr);
  console.log('Public tables present:', Object.keys(ident.rows[0].tables ?? {}).sort().join(', '));

  for (const f of FILES) {
    const full = path.resolve(f);
    const sql = fs.readFileSync(full, 'utf8');
    console.log('\n===', path.basename(full), '===');
    console.log(sql.split('\n').filter(l => l.trim() && !l.startsWith('--')).join('\n'));

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log('-> COMMITTED');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('-> ROLLED BACK:', e.message);
      process.exit(1);
    }
  }

  console.log('\n=== Post-migration sanity ===');
  const checkPayments = await client.query(`
    select pg_get_constraintdef(c.oid) as def
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname='payments' and c.conname='payments_status_check'`);
  console.log('payments_status_check =>', checkPayments.rows[0]?.def);

  const checkColumn = await client.query(`
    select column_name, is_nullable from information_schema.columns
    where table_name='payments' and column_name='payment_date'`);
  console.log('payments.payment_date =>', checkColumn.rows[0]);

  const checkView = await client.query(`select count(*)::int as n from v_members_with_period`);
  console.log('v_members_with_period rowcount =>', checkView.rows[0].n);

  const samplePeriods = await client.query(`
    select name, current_period_start::date, current_period_end::date
    from v_members_with_period
    where status='active' and current_period_start is not null
    order by current_period_start desc limit 3`);
  console.log('sample active members with period =>', samplePeriods.rows);

  await client.end();
  console.log('\nAll done.');
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
