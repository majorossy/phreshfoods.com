#!/usr/bin/env node

/**
 * Generate WebP versions of all images in the public directory
 * This creates .webp files alongside the originals for fallback support
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  quality: 85,
  effort: 4, // 0-6, higher = better compression but slower
  publicDir: path.join(__dirname, '..', 'public'),
  extensions: ['.jpg', '.jpeg', '.png'],
  skipPatterns: [/\.webp$/i, /Flag_of_Maine\.svg/i],
};

// ANSI colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

async function findImages(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await findImages(filePath, fileList);
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (CONFIG.extensions.includes(ext)) {
        const shouldSkip = CONFIG.skipPatterns.some(p => p.test(filePath));
        if (!shouldSkip) {
          fileList.push(filePath);
        }
      }
    }
  }

  return fileList;
}

async function generateWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // Skip if WebP already exists and is newer than source
  try {
    const [sourceStats, webpStats] = await Promise.all([
      fs.stat(inputPath),
      fs.stat(outputPath).catch(() => null)
    ]);

    if (webpStats && webpStats.mtime > sourceStats.mtime) {
      return { skipped: true };
    }
  } catch (err) {
    // Continue with conversion
  }

  try {
    const originalStats = await fs.stat(inputPath);

    await sharp(inputPath)
      .webp({
        quality: CONFIG.quality,
        effort: CONFIG.effort,
        // Preserve transparency for PNGs
        ...(path.extname(inputPath).toLowerCase() === '.png' ? {
          alphaQuality: 100,
        } : {})
      })
      .toFile(outputPath);

    const webpStats = await fs.stat(outputPath);
    const savings = ((originalStats.size - webpStats.size) / originalStats.size * 100).toFixed(1);

    return {
      success: true,
      originalSize: originalStats.size,
      webpSize: webpStats.size,
      savings: parseFloat(savings)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log(`${colors.cyan}${colors.bold}🖼️  WebP Generator${colors.reset}\n`);
  console.log(`Creating WebP versions in: ${CONFIG.publicDir}\n`);

  const images = await findImages(CONFIG.publicDir);
  console.log(`Found ${colors.yellow}${images.length}${colors.reset} images to process\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let totalSaved = 0;

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const relative = path.relative(CONFIG.publicDir, file);

    process.stdout.write(`[${i + 1}/${images.length}] Processing ${relative}...`);

    const result = await generateWebP(file);

    if (process.stdout.clearLine) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    } else {
      process.stdout.write('\r');
    }

    if (result.skipped) {
      skipped++;
      console.log(`${colors.yellow}⊘${colors.reset} ${relative} (already up-to-date)`);
    } else if (result.success) {
      processed++;
      totalSaved += (result.originalSize - result.webpSize);
      const color = result.savings > 20 ? colors.green : colors.yellow;
      console.log(`${colors.green}✓${colors.reset} ${relative} ${color}(${result.savings}% smaller)${colors.reset}`);
    } else {
      errors++;
      console.log(`${colors.red}✗${colors.reset} ${relative}: ${result.error}`);
    }
  }

  console.log(`\n${colors.cyan}${colors.bold}Summary:${colors.reset}`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped:   ${skipped} (already up-to-date)`);
  if (errors > 0) console.log(`  Errors:    ${errors}`);
  console.log(`  Total saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n${colors.green}WebP files generated successfully!${colors.reset}`);
  console.log(`Your images will now be served as WebP with automatic fallback.`);
}

main().catch(console.error);