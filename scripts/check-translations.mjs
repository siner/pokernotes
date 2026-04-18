#!/usr/bin/env node
/**
 * i18n Translation Parity Check
 *
 * Verifies that every key present in en.json also exists in es.json.
 * Exits with code 1 if any key is missing (fails CI).
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const en = JSON.parse(readFileSync(join(root, 'messages/en.json'), 'utf8'));
const es = JSON.parse(readFileSync(join(root, 'messages/es.json'), 'utf8'));

let errors = 0;

function checkKeys(source, target, path = '') {
  for (const key of Object.keys(source)) {
    const fullPath = path ? `${path}.${key}` : key;

    if (!(key in target)) {
      console.error(`❌  Missing key in es.json: ${fullPath}`);
      errors++;
    } else if (
      typeof source[key] === 'object' &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      checkKeys(source[key], target[key], fullPath);
    }
  }
}

checkKeys(en, es);

if (errors > 0) {
  console.error(`\n✗ Found ${errors} missing translation key(s) in es.json`);
  process.exit(1);
} else {
  console.log('✓ All translation keys are in parity (en ↔ es)');
}
