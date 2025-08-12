const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

exports.stream = (req, res) => {
  const requested = req.params[0] || req.params.filename || '';
  const safePath = path
    .normalize(requested)
    .replace(/^([\.]{2}[\/])+/, '');
  const filePath = path.join(__dirname, '../../../uploads', safePath);
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({ message: 'File not found' });
    }

    const range = req.headers.range;
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    if (!range) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return fs.createReadStream(filePath).pipe(res);
    }

    const positions = range.replace(/bytes=/, '').split('-');
    const start = parseInt(positions[0], 10);
    const end = positions[1] ? parseInt(positions[1], 10) : stats.size - 1;

    if (start >= stats.size || end >= stats.size) {
      res.status(416).setHeader('Content-Range', `bytes */${stats.size}`);
      return res.end();
    }

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  });
};
