import { removeBackgroundFromImageBase64 } from 'remove.bg';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) return res.status(500).json({ error: err.message });

      const file = files.image;
      const buffer = fs.readFileSync(file.filepath);
      const base64 = buffer.toString('base64');

      try {
        const outputBase64 = await removeBackgroundFromImageBase64({
          base64img: base64,
          size: 'regular',
        });

        const outputBuffer = Buffer.from(outputBase64, 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.send(outputBuffer);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
