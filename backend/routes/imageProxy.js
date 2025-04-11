const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Image URL is required');

  try {
    const imageResponse = await axios.get(url, { responseType: 'stream' });
    res.setHeader('Content-Type', imageResponse.headers['content-type']);
    imageResponse.data.pipe(res);
  } catch (err) {
    res.status(500).send('Failed to fetch image');
  }
});

module.exports = router;