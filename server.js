const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // ZIPも含めて50MBまで
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/resize-zip', upload.single('zipfile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIPファイルがありません' });

    const zip = new AdmZip(req.file.buffer);
    const zipEntries = zip.getEntries();
    const outputZip = new AdmZip();

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      // 画像ファイルのみ対象
      if (!/\.(jpe?g|png|bmp|webp)$/i.test(entry.entryName)) continue;

      const buffer = entry.getData();
      const resizedBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .jpeg({ quality: 90 }) // JPEGで出力
        .toBuffer();

      // 元ファイル名を.jpgに変更
      const baseName = path.parse(entry.entryName).name;
      outputZip.addFile(baseName + '.jpg', resizedBuffer);
    }

    const zipBuffer = outputZip.toBuffer();

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="resized_images.zip"',
      'Content-Length': zipBuffer.length
    });

    res.send(zipBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '変換中にエラーが発生しました' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
