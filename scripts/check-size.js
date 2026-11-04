import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const distDir = path.resolve(process.cwd(), 'dist');
const manifestPath = path.join(distDir, '.vite', 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error(`Error: Manifest file not found at ${manifestPath}. Run 'npm run build' first.`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch (err) {
  console.error(`Error reading or parsing ${manifestPath}:`, err);
  process.exit(1);
}

const ENTRIES = [
  {
    name: 'index.html',
    budgetBytes: 25 * 1024,
    budgetLabel: '25 KB',
    isPublic: true
  },
  {
    name: 'admin.html',
    budgetBytes: 75 * 1024,
    budgetLabel: '75 KB',
    isPublic: false
  }
];

function collectInitialJsFiles(manifest, entryKey) {
  const collectedFiles = new Set();
  const visitedKeys = new Set();

  function visit(key) {
    if (visitedKeys.has(key)) return;
    visitedKeys.add(key);

    const item = manifest[key];
    if (!item) return;

    if (item.file && item.file.endsWith('.js')) {
      collectedFiles.add(item.file);
    }

    if (Array.isArray(item.imports)) {
      for (const importKey of item.imports) {
        visit(importKey);
      }
    }
  }

  visit(entryKey);
  return Array.from(collectedFiles);
}

let hasFailure = false;
const results = [];

for (const entry of ENTRIES) {
  if (!manifest[entry.name]) {
    console.error(`FAIL: Entry "${entry.name}" not found in manifest.`);
    hasFailure = true;
    continue;
  }

  const files = collectInitialJsFiles(manifest, entry.name);
  let totalGzBytes = 0;
  const fileDetails = [];

  for (const file of files) {
    const fullPath = path.join(distDir, file);
    if (!existsSync(fullPath)) {
      console.error(`FAIL: Chunk file not found: ${fullPath}`);
      hasFailure = true;
      continue;
    }

    const contentBuffer = readFileSync(fullPath);
    const gz = gzipSync(contentBuffer);
    totalGzBytes += gz.length;
    fileDetails.push({ file, rawBytes: contentBuffer.length, gzBytes: gz.length });

    // Public initial chunk restrictions
    if (entry.isPublic) {
      const fileNameLower = path.basename(file).toLowerCase();
      if (fileNameLower.includes('supabase')) {
        console.error(`FAIL: Public initial chunk file name "${file}" contains "supabase"`);
        hasFailure = true;
      }

      const contentStr = contentBuffer.toString('utf8');
      if (contentStr.includes('@supabase/')) {
        console.error(`FAIL: Public initial chunk content "${file}" contains "@supabase/"`);
        hasFailure = true;
      }
    }
  }

  const gzKb = (totalGzBytes / 1024).toFixed(2);
  const budgetKb = (entry.budgetBytes / 1024).toFixed(0) + ' KB';
  const passedBudget = totalGzBytes <= entry.budgetBytes;

  if (!passedBudget) {
    console.error(
      `FAIL: Entry "${entry.name}" exceeds budget: ${gzKb} KB > ${budgetKb} (${totalGzBytes} bytes > ${entry.budgetBytes} bytes)`
    );
    hasFailure = true;
  }

  const entryFailed = !passedBudget || (entry.isPublic && hasFailure);
  const status = entryFailed ? 'FAIL' : 'PASS';

  results.push({
    entry: entry.name,
    filesCount: files.length,
    files: files.join(', '),
    gzKb: `${gzKb} KB`,
    budget: `≤ ${budgetKb}`,
    status
  });
}

// Print formatted summary table
const maxFilesLen = Math.max(10, ...results.map((r) => r.files.length));

console.log('\n=== First-Load Size Budget Check ===\n');
console.log(
  '| ' +
    'entry'.padEnd(12) +
    ' | ' +
    'files'.padEnd(maxFilesLen) +
    ' | ' +
    'gz KB'.padStart(10) +
    ' | ' +
    'budget'.padStart(10) +
    ' | ' +
    'PASS/FAIL'.padEnd(9) +
    ' |'
);
console.log(
  '|-' +
    '-'.repeat(12) +
    '-|-' +
    '-'.repeat(maxFilesLen) +
    '-|-' +
    '-'.repeat(10) +
    '-|-' +
    '-'.repeat(10) +
    '-|-' +
    '-'.repeat(9) +
    '-|'
);

for (const r of results) {
  console.log(
    '| ' +
      r.entry.padEnd(12) +
      ' | ' +
      r.files.padEnd(maxFilesLen) +
      ' | ' +
      r.gzKb.padStart(10) +
      ' | ' +
      r.budget.padStart(10) +
      ' | ' +
      r.status.padEnd(9) +
      ' |'
  );
}
console.log('');

if (hasFailure) {
  console.error('Size check failed.');
  process.exit(1);
} else {
  console.log('All first-load size checks passed successfully.');
}
