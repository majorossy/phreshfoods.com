import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.join(__dirname, '..', 'public', 'images', 'icons');
const WEBP_QUALITY = 85; // Good balance of quality vs file size

async function generateWebPIcon(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();

    await sharp(inputPath)
      .webp({
        quality: WEBP_QUALITY,
        effort: 6, // Higher effort = better compression (0-6)
        lossless: false // Lossy compression for smaller files
      })
      .resize({
        width: metadata.width,
        height: metadata.height,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
    return false;
  }
}

async function processAllIcons() {
  console.log('🎨 Starting WebP conversion for product icons...\n');

  // Get all JPG files in the icons directory
  const files = await fs.readdir(ICONS_DIR);
  const jpgFiles = files.filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));

  console.log(`Found ${jpgFiles.length} JPG files to convert\n`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;

  for (const file of jpgFiles) {
    const inputPath = path.join(ICONS_DIR, file);
    const outputPath = path.join(ICONS_DIR, file.replace(/\.(jpg|jpeg)$/i, '.webp'));

    // Check if WebP already exists
    if (await fs.pathExists(outputPath)) {
      const inputStats = await fs.stat(inputPath);
      const outputStats = await fs.stat(outputPath);

      // Skip if WebP is newer than source
      if (outputStats.mtime > inputStats.mtime) {
        console.log(`⏭️  Skipping ${file} (WebP already exists and is up to date)`);
        skipped++;
        continue;
      }
    }

    const inputStats = await fs.stat(inputPath);
    totalSizeBefore += inputStats.size;

    console.log(`🔄 Converting ${file}...`);
    const success = await generateWebPIcon(inputPath, outputPath);

    if (success) {
      const outputStats = await fs.stat(outputPath);
      totalSizeAfter += outputStats.size;

      const sizeBefore = (inputStats.size / 1024).toFixed(1);
      const sizeAfter = (outputStats.size / 1024).toFixed(1);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

      console.log(`   ✅ Created ${file.replace(/\.(jpg|jpeg)$/i, '.webp')}`);
      console.log(`   📊 Size: ${sizeBefore}KB → ${sizeAfter}KB (${reduction}% smaller)\n`);
      converted++;
    } else {
      console.log(`   ❌ Failed to convert ${file}\n`);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CONVERSION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Converted: ${converted} files`);
  console.log(`⏭️  Skipped: ${skipped} files (already up to date)`);
  console.log(`❌ Failed: ${failed} files`);

  if (converted > 0) {
    const totalReduction = ((1 - totalSizeAfter / totalSizeBefore) * 100).toFixed(1);
    console.log(`\n💾 Total size reduction: ${totalReduction}%`);
    console.log(`   Before: ${(totalSizeBefore / 1024).toFixed(1)}KB total`);
    console.log(`   After: ${(totalSizeAfter / 1024).toFixed(1)}KB total`);
    console.log(`   Saved: ${((totalSizeBefore - totalSizeAfter) / 1024).toFixed(1)}KB`);
  }

  console.log('\n✨ WebP generation complete!');

  // List of all unique product names for verification
  const productNames = new Set(
    jpgFiles.map(f => f.replace(/_[01]\.jpg$/i, '')).filter(name => name)
  );
  console.log(`\n📦 Products with icons: ${productNames.size} unique products`);
}

// Run the conversion
processAllIcons().catch(console.error);