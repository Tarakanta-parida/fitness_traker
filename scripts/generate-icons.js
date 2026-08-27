const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makeCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = makeCrcTable();

function getCrc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createPngIcon(width, height) {
  const header = Buffer.from([139, 80, 78, 71, 13, 10, 26, 10]);

  const rawPixels = Buffer.alloc(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.min(width, height) * 0.45;
  const innerRadius = Math.min(width, height) * 0.28;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = (x + y) / (width + height);

      if (dist <= outerRadius) {
        // Emerald / Blue gradient badge background
        rawPixels[idx] = Math.round(15 + t * 20);     // R
        rawPixels[idx + 1] = Math.round(185 - t * 40); // G
        rawPixels[idx + 2] = Math.round(129 + t * 60); // B
        rawPixels[idx + 3] = 255;                    // Alpha
      } else {
        // Transparent outside
        rawPixels[idx] = 0;
        rawPixels[idx + 1] = 0;
        rawPixels[idx + 2] = 0;
        rawPixels[idx + 3] = 0;
      }

      // Center Leaf Emblem overlay
      if (dist <= innerRadius) {
        rawPixels[idx] = 255;
        rawPixels[idx + 1] = 255;
        rawPixels[idx + 2] = 255;
        rawPixels[idx + 3] = 255;
      }
    }
  }

  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0;
    rawPixels.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(scanlines);

  function writeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const calcCrc = getCrc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(calcCrc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = writeChunk('IHDR', ihdr);
  const idatChunk = writeChunk('IDAT', compressedData);
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');

const icon192 = createPngIcon(192, 192);
const icon512 = createPngIcon(512, 512);
const appLogoPng = createPngIcon(256, 256);
const faviconIco = createPngIcon(32, 32);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);
fs.writeFileSync(path.join(publicDir, 'app-logo.png'), appLogoPng);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco);

console.log("Successfully generated PWA & App Logo icons in public/ directory!");
