#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  quality: 85, // WebP quality (0-100)
  lossless: false, // Use lossy compression for better file size
  effort: 4, // Compression effort (0-6, higher = slower but smaller)
  publicDir: path.join(__dirname, '..', 'public'),
  extensions: ['.jpg', '.jpeg', '.png'],
  skipPatterns: [/Flag_of_Maine\.svg/], // Files to skip
};

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

async function getAllImageFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      await getAllImageFiles(filePath, fileList);
    } else {
      const ext = path.extname(file.name).toLowerCase();
      if (CONFIG.extensions.includes(ext)) {
        // Check if file should be skipped
        const shouldSkip = CONFIG.skipPatterns.some(pattern => pattern.test(filePath));
        if (!shouldSkip) {
          fileList.push(filePath);
        }
      }
    }
  }

  return fileList;
}

async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  try {
    // Get original file size
    const originalStats = await fs.stat(inputPath);
    const originalSize = originalStats.size;

    // Convert to WebP
    await sharp(inputPath)
      .webp({
        quality: CONFIG.quality,
        lossless: CONFIG.lossless,
        effort: CONFIG.effort,
        // Use appropriate settings based on file type
        ...(path.extname(inputPath).toLowerCase() === '.png' ? {
          alphaQuality: 100, // Preserve transparency
        } : {})
      })
      .toFile(outputPath);

    // Get new file size
    const newStats = await fs.stat(outputPath);
    const newSize = newStats.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    return {
      success: true,
      originalSize,
      newSize,
      savings: parseFloat(savings),
      outputPath
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log(`${colors.cyan}${colors.bold}🖼️  WebP Conversion Tool${colors.reset}\n`);
  console.log(`Converting images in: ${CONFIG.publicDir}`);
  console.log(`Quality: ${CONFIG.quality}, Lossless: ${CONFIG.lossless}, Effort: ${CONFIG.effort}\n`);

  try {
    // Find all image files
    const imageFiles = await getAllImageFiles(CONFIG.publicDir);
    console.log(`Found ${colors.yellow}${imageFiles.length}${colors.reset} images to convert\n`);

    let totalOriginalSize = 0;
    let totalNewSize = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process images with progress indicator
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const relativePath = path.relative(CONFIG.publicDir, file);

      process.stdout.write(`[${i + 1}/${imageFiles.length}] Converting ${relativePath}...`);

      const result = await convertToWebP(file);

      if (result.success) {
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;
        successCount++;

        // Show savings with color coding
        let savingsColor = colors.green;
        if (result.savings < 10) savingsColor = colors.yellow;
        if (result.savings < 0) savingsColor = colors.red;

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(
          `${colors.green}✓${colors.reset} ${relativePath} ` +
          `(${savingsColor}${result.savings}% smaller${colors.reset})`
        );
      } else {
        errorCount++;
        errors.push({ file: relativePath, error: result.error });
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(`${colors.red}✗${colors.reset} ${relativePath}: ${result.error}`);
      }
    }

    // Summary
    console.log(`\n${colors.cyan}${colors.bold}📊 Conversion Summary${colors.reset}`);
    console.log(`${colors.green}✓ Successfully converted:${colors.reset} ${successCount} images`);

    if (errorCount > 0) {
      console.log(`${colors.red}✗ Failed:${colors.reset} ${errorCount} images`);
    }

    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1);
    const originalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const newMB = (totalNewSize / 1024 / 1024).toFixed(2);

    console.log(`\n${colors.bold}File Size Reduction:${colors.reset}`);
    console.log(`  Original: ${originalMB} MB`);
    console.log(`  WebP:     ${newMB} MB`);
    console.log(`  Savings:  ${colors.green}${totalSavings}%${colors.reset} (${((totalOriginalSize - totalNewSize) / 1024 / 1024).toFixed(2)} MB)`);

    if (errors.length > 0) {
      console.log(`\n${colors.red}Errors:${colors.reset}`);
      errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }

    // Create a conversion report
    const report = {
      timestamp: new Date().toISOString(),
      totalImages: imageFiles.length,
      converted: successCount,
      failed: errorCount,
      originalSizeMB: parseFloat(originalMB),
      newSizeMB: parseFloat(newMB),
      savingsPercent: parseFloat(totalSavings),
      config: CONFIG,
      errors: errors
    };

    await fs.writeFile(
      path.join(__dirname, 'webp-conversion-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`\n${colors.cyan}Report saved to: scripts/webp-conversion-report.json${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run the conversion
main().catch(console.error);