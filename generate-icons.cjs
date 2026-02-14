const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'src-tauri', 'icons');

// Create ICO file header
function createIcoHeader(numImages) {
  const buffer = Buffer.alloc(6);
  buffer.writeUInt16LE(0, 0);      // Reserved
  buffer.writeUInt16LE(1, 2);      // Type: 1 = ICO
  buffer.writeUInt16LE(numImages, 4); // Number of images
  return buffer;
}

function createIcoEntry(width, height, offset, size) {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt8(width === 256 ? 0 : width, 0);   // Width
  buffer.writeUInt8(height === 256 ? 0 : height, 1); // Height
  buffer.writeUInt8(0, 2);           // Color palette
  buffer.writeUInt8(0, 3);           // Reserved
  buffer.writeUInt16LE(1, 4);        // Color planes
  buffer.writeUInt16LE(32, 6);       // Bits per pixel
  buffer.writeUInt32LE(size, 8);     // Size of image data
  buffer.writeUInt32LE(offset, 12);  // Offset to image data
  return buffer;
}

// Create a simple purple gradient icon
async function generateIconSvg(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#646cff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9356ff;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-size="${size * 0.45}" fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">N</text>
    </svg>
  `;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate PNG icons
  const buffer32 = await generateIconSvg(32);
  fs.writeFileSync(path.join(iconsDir, '32x32.png'), buffer32);
  
  const buffer128 = await generateIconSvg(128);
  fs.writeFileSync(path.join(iconsDir, '128x128.png'), buffer128);
  
  const buffer256 = await generateIconSvg(256);
  fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), buffer256);

  // Create proper ICO file with multiple sizes
  const icoSizes = [16, 32, 48, 256];
  const pngBuffers = await Promise.all(icoSizes.map(s => generateIconSvg(s)));
  
  const header = createIcoHeader(icoSizes.length);
  const entries = [];
  const dataBuffers = [...pngBuffers];
  
  let currentOffset = 6 + (16 * icoSizes.length); // Header + entries
  
  for (let i = 0; i < icoSizes.length; i++) {
    entries.push(createIcoEntry(icoSizes[i], icoSizes[i], currentOffset, dataBuffers[i].length));
    currentOffset += dataBuffers[i].length;
  }
  
  const icoBuffer = Buffer.concat([header, ...entries, ...dataBuffers]);
  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);

  // For macOS icns - just copy PNG (not proper but works for build)
  fs.writeFileSync(path.join(iconsDir, 'icon.icns'), buffer256);

  console.log('Icons generated successfully!');
}

main().catch(console.error);
