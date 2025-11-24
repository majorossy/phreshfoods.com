#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeCenterPin() {
  const inputPath = path.join(__dirname, '../public/images/center-pin.png');
  const outputDir = path.join(__dirname, '../public/images');

  console.log('🔄 Optimizing center-pin.png...');

  try {
    // Read the original image
    const originalBuffer = await fs.readFile(inputPath);
    const metadata = await sharp(originalBuffer).metadata();
    console.log(`📊 Original: ${metadata.width}x${metadata.height}, Size: ${(originalBuffer.length / 1024 / 1024).toFixed(2)}MB`);

    // Create optimized PNG versions at different sizes for different DPIs
    const sizes = [
      { suffix: '@1x', size: 34 },   // Standard DPI
      { suffix: '@2x', size: 68 },   // Retina displays
      { suffix: '@3x', size: 102 },  // High DPI mobile
    ];

    for (const { suffix, size } of sizes) {
      // Optimized PNG
      const pngPath = path.join(outputDir, `center-pin${suffix}.png`);
      await sharp(originalBuffer)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false
        })
        .png({
          quality: 90,
          compressionLevel: 9,
          palette: true
        })
        .toFile(pngPath);

      const pngStats = await fs.stat(pngPath);
      console.log(`✅ Created ${path.basename(pngPath)}: ${size}x${size}, Size: ${(pngStats.size / 1024).toFixed(2)}KB`);

      // WebP version
      const webpPath = path.join(outputDir, `center-pin${suffix}.webp`);
      await sharp(originalBuffer)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          withoutEnlargement: false
        })
        .webp({
          quality: 85,
          effort: 6
        })
        .toFile(webpPath);

      const webpStats = await fs.stat(webpPath);
      console.log(`✅ Created ${path.basename(webpPath)}: ${size}x${size}, Size: ${(webpStats.size / 1024).toFixed(2)}KB`);
    }

    // Calculate total savings
    const newPngSize = (await fs.stat(path.join(outputDir, 'center-pin@2x.png'))).size;
    const savings = ((originalBuffer.length - newPngSize) / originalBuffer.length * 100).toFixed(1);
    console.log(`\n🎉 Optimization complete! Size reduced by ${savings}%`);
    console.log(`💡 Use center-pin@2x.png for Retina displays (most common)`);

  } catch (error) {
    console.error('❌ Error optimizing image:', error);
    process.exit(1);
  }
}

optimizeCenterPin();