import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
      if (fileNameLower.includes('tfjs') || fileNameLower.includes('tensorflow')) {
        console.error(`FAIL: Public initial chunk file name "${file}" contains tfjs/tensorflow`);
        hasFailure = true;
      }

      const contentStr = contentBuffer.toString('utf8');
      if (contentStr.includes('@supabase/')) {
        console.error(`FAIL: Public initial chunk content "${file}" contains "@supabase/"`);
        hasFailure = true;
      }
      if (contentStr.includes('@tensorflow/') || contentStr.includes('tfjs')) {
        console.error(`FAIL: Public initial chunk content "${file}" contains "@tensorflow/" or "tfjs"`);
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

// === Try-on Model Download Budget Check (≤ 8 MB raw) ===
function getAllFilesRecursive(dirPath) {
  let list = [];
  if (!existsSync(dirPath)) return list;
  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(getAllFilesRecursive(full));
    } else {
      list.push(full);
    }
  }
  return list;
}

const movenetVendorDir = path.resolve(process.cwd(), 'public', 'vendor', 'movenet');
const modelFiles = getAllFilesRecursive(movenetVendorDir).filter((file) => {
  const base = path.basename(file);
  return base === 'model.json' || base.endsWith('.bin');
});

let modelRawBytes = 0;
let modelGzBytes = 0;
for (const file of modelFiles) {
  const buf = readFileSync(file);
  modelRawBytes += buf.length;
  modelGzBytes += gzipSync(buf).length;
}

const publicInitialFiles = new Set(collectInitialJsFiles(manifest, 'index.html'));

// Find JS chunks dynamically imported for tryon (including tfjs)
const tryonJsFiles = new Set();

// 1. Include every chunk containing tfjs or @tensorflow
for (const [key, item] of Object.entries(manifest)) {
  if (item && item.file && item.file.endsWith('.js')) {
    const lowerKey = key.toLowerCase();
    const lowerFile = item.file.toLowerCase();
    if (lowerKey.includes('tensorflow') || lowerKey.includes('tfjs') || lowerFile.includes('tfjs')) {
      if (!publicInitialFiles.has(item.file)) {
        tryonJsFiles.add(item.file);
      }
    }
  }
}

// 2. Chunks dynamically imported from tryon module reachable from app.js / index.html
function traceDynamicChunks(entryKey) {
  const item = manifest[entryKey];
  if (!item) return;

  const dynamicImports = item.dynamicImports || [];
  for (const dynKey of dynamicImports) {
    const dynItem = manifest[dynKey];
    if (!dynItem) continue;
    const lowerDynKey = dynKey.toLowerCase();
    const lowerDynFile = (dynItem.file || '').toLowerCase();
    if (lowerDynKey.includes('tryon') || lowerDynFile.includes('tryon')) {
      if (dynItem.file && dynItem.file.endsWith('.js') && !publicInitialFiles.has(dynItem.file)) {
        tryonJsFiles.add(dynItem.file);
      }
      if (Array.isArray(dynItem.imports)) {
        for (const impKey of dynItem.imports) {
          const impItem = manifest[impKey];
          if (impItem && impItem.file && impItem.file.endsWith('.js') && !publicInitialFiles.has(impItem.file)) {
            tryonJsFiles.add(impItem.file);
          }
        }
      }
    }
  }
}

traceDynamicChunks('index.html');
for (const k of Object.keys(manifest)) {
  if (k.includes('app.js')) {
    traceDynamicChunks(k);
  }
}

let tryonJsRawBytes = 0;
let tryonJsGzBytes = 0;
for (const jsFile of tryonJsFiles) {
  const fullPath = path.join(distDir, jsFile);
  if (existsSync(fullPath)) {
    const buf = readFileSync(fullPath);
    tryonJsRawBytes += buf.length;
    tryonJsGzBytes += gzipSync(buf).length;
  }
}

const totalTryonRawBytes = modelRawBytes + tryonJsRawBytes;
const totalTryonGzBytes = modelGzBytes + tryonJsGzBytes;
const tryonBudgetBytes = 8 * 1024 * 1024; // 8 MB

const totalTryonRawMb = (totalTryonRawBytes / (1024 * 1024)).toFixed(2);
const totalTryonGzMb = (totalTryonGzBytes / (1024 * 1024)).toFixed(2);
const modelRawMb = (modelRawBytes / (1024 * 1024)).toFixed(2);
const modelGzMb = (modelGzBytes / (1024 * 1024)).toFixed(2);
const jsRawMb = (tryonJsRawBytes / (1024 * 1024)).toFixed(2);
const jsGzMb = (tryonJsGzBytes / (1024 * 1024)).toFixed(2);

console.log('=== Try-On Download Budget Check (≤ 8 MB raw) ===\n');
console.log(`- Model files (vendor/movenet): ${modelRawMb} MB raw (${modelGzMb} MB gz) across ${modelFiles.length} files`);
console.log(`- Try-on JS chunks (tfjs + tryon): ${jsRawMb} MB raw (${jsGzMb} MB gz) across ${tryonJsFiles.size} chunks [${Array.from(tryonJsFiles).join(', ')}]`);
console.log(`- Total download size: ${totalTryonRawMb} MB raw / ${totalTryonGzMb} MB gz (budget: ≤ 8.00 MB raw)`);

const passedTryonBudget = totalTryonRawBytes <= tryonBudgetBytes;
if (!passedTryonBudget) {
  console.error(
    `FAIL: Try-on total download exceeds 8 MB budget: ${totalTryonRawMb} MB > 8.00 MB (${totalTryonRawBytes} > ${tryonBudgetBytes} bytes)`
  );
  hasFailure = true;
} else {
  console.log(`Status: PASS\n`);
}

if (hasFailure) {
  console.error('Size check failed.');
  process.exit(1);
} else {
  console.log('All first-load size checks passed successfully.');
}
