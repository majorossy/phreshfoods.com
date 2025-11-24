#!/usr/bin/env node

/**
 * Script to replace console.log statements with logger calls
 * Run with: node scripts/replace-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/components/Map/MapComponent.tsx',
  'src/contexts/TripPlannerContext.tsx',
  'src/contexts/SearchContext.tsx'
];

// Skip patterns - lines containing these won't be modified
const skipPatterns = [
  'logger',  // Already using logger
  'console.error',  // Keep error logging
  'console.warn',   // Keep warnings
  '// console.log', // Already commented
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Check if file already imports logger
  const hasLoggerImport = content.includes("from '../utils/logger'") ||
                         content.includes('from "../utils/logger"') ||
                         content.includes("from '../../utils/logger'") ||
                         content.includes('from "../../utils/logger"');

  // Replace console.log with logger.log
  const lines = content.split('\n');
  const modifiedLines = lines.map(line => {
    // Skip if line contains skip patterns
    if (skipPatterns.some(pattern => line.includes(pattern))) {
      return line;
    }

    // Replace console.log with logger.log
    if (line.includes('console.log(')) {
      return line.replace(/console\.log\(/g, 'logger.log(');
    }

    return line;
  });

  content = modifiedLines.join('\n');

  // Add logger import if needed and file was modified
  if (!hasLoggerImport && content !== originalContent) {
    // Find the right import path based on file location
    const depth = filePath.split('/').length - 2; // -1 for src, -1 for file
    const importPath = depth > 0 ? '../'.repeat(depth) + 'utils/logger' : './utils/logger';

    // Add import after the first line (usually a comment)
    const importStatement = `import { logger } from '${importPath}';\n`;

    // Find where to insert the import (after other imports or at top)
    const importIndex = content.search(/^import /m);
    if (importIndex !== -1) {
      // Add after last import
      const lines = content.split('\n');
      let lastImportIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    } else {
      // Add at the beginning (after any initial comments)
      const lines = content.split('\n');
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith('//') && lines[i].trim() !== '') {
          insertIndex = i;
          break;
        }
      }
      lines.splice(insertIndex, 0, importStatement);
      content = lines.join('\n');
    }
  }

  // Write back if modified
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);

    // Count replacements
    const replacements = (originalContent.match(/console\.log\(/g) || []).length;
    console.log(`   Replaced ${replacements} console.log statements`);
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
  }
}

console.log('🔄 Replacing console.log statements with logger...\n');

filesToUpdate.forEach(processFile);

console.log('\n✅ Done! Remember to test the changes.');
console.log('💡 Tip: You can now use logger.log(), logger.warn(), logger.error(), etc.');