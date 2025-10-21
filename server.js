// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const AdmZip = require('adm-zip');

const app = express();
const PORT = process.env.PORT || 3000;

// 一時保存用ディスクストレージ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => cb(null, file.originalname)
});

// ファイルサイズ制限を 200MB に拡張
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});

// 静的ファイル
app.use(express.static(path.join(__dirname, 'public')));

// ZIPアップロード処理
app.post('/api/resize-zip', upload.single('zipfile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'ZIPファイルがありません' });

    // 事前チェック：ファイルサイズが制限を超えた場合
    if (req.file.size > MAX_FILE_SIZE) {
      fs.unlinkSync(req.file.path); // 一時ファイル削除
      return res.status(400).json({ error: `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / (1024*1024)}MB）` });
    }

    const zipPath = req.file.path;
    const outputZip = new AdmZip();
    const tempDir = path.join(__dirname, 'uploads', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      const ext = path.extname(entry.entryName).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) continue;

      const tempInputPath = path.join(tempDir, path.basename(entry.entryName));
      fs.writeFileSync(tempInputPath, entry.getData());

      const tempOutputPath = path.join(tempDir, path.basename(entry.entryName, ext) + '.jpg');
      await sharp(tempInputPath)
        .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .jpeg()
        .toFile(tempOutputPath);

      outputZip.addLocalFile(tempOutputPath);

      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);
    }

    const outputBuffer = outputZip.toBuffer();
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename=resized_images.zip');
    res.send(outputBuffer);

  } catch (err) {
    console.error('ZIP変換エラー:', err);
    res.status(500).json({ error: '変換中にエラーが発生しました' });
  } finally {
    // 元ZIP削除
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
