import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { validateSingleA4Capacity, validateOptionCompatibility } from '../src/lib/manufacturing-calculations.ts';

test('Unknown option values and missing required options cannot reach manufacturing', () => {
  const options = [{code:'motor',name:'Motor',isRequired:true,allowedValues:[{value:'left',label:'Izquierdo'}]}];
  assert.equal(validateOptionCompatibility({},options).valid,false);
  assert.equal(validateOptionCompatibility({motor:'invented'},options).valid,false);
  assert.equal(validateOptionCompatibility({motor:'left'},options).valid,true);
});

test('A4 validator rejects long descriptions and configuration values, not just row counts', () => {
  assert.equal(validateSingleA4Capacity({supplies:[{code:'A',name:'X'.repeat(500),quantity:1,unitOfMeasure:'un'}]}).fitsInSingleA4,false);
  assert.equal(validateSingleA4Capacity({supplies:[],configuration:{motor:'X'.repeat(500)}}).fitsInSingleA4,false);
});

test('Catalog binding migration is repeatable and inaccessible to browser roles', async () => {
  const db = new PGlite();
  try {
    await db.exec(fs.readFileSync('tests/fixtures/commercial-current-schema.sql','utf8'));
    const migration = fs.readFileSync('supabase/migrations/20261015000100_catalog_manufacturing_bindings.sql','utf8');
    await db.exec(migration); await db.exec(migration);
    for (const role of ['anon','authenticated']) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query('select * from public.catalog_manufacturing_bindings'),/permission denied/);
      await db.exec('reset role');
    }
  } finally { await db.close(); }
});
