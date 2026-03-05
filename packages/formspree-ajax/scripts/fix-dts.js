#!/usr/bin/env node
/**
 * Post-build script to fix the generated .d.ts file
 * tsup doesn't preserve 'export type' syntax, so we need to fix it manually
 */

const fs = require('fs');
const path = require('path');

const dtsPath = path.join(__dirname, '../dist/index.d.ts');

try {
  let content = fs.readFileSync(dtsPath, 'utf8');

  // Replace the combined export with separate exports
  content = content.replace(
    /export \{ FormspreeClient, FormspreeClientConfig \};/g,
    'export { FormspreeClient };\nexport type { FormspreeClientConfig };'
  );

  fs.writeFileSync(dtsPath, content, 'utf8');
  console.log('✓ Fixed type declarations in dist/index.d.ts');
} catch (error) {
  console.error('Error fixing .d.ts file:', error.message);
  process.exit(1);
}
