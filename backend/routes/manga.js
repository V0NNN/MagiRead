const express = require("express");
const axios = require("axios");
const router = express.Router();
const qs = require("qs");

const MANGADEX_API = "https://api.mangadex.org";

router.get("/proxy", async (req, res) => {
    const { endpoint, ...otherParams } = req.query;
  
    if (!endpoint) {
      return res.status(400).json({ error: "Missing endpoint parameter" });
    }
  
    const parsedParams = {};
    for (const [key, value] of Object.entries(otherParams)) {
      if (key.endsWith("[]")) {
        const baseKey = key.slice(0, -2);
        parsedParams[baseKey] = Array.isArray(value) ? value : [value];
      } else {
        parsedParams[key] = value;
      }
    }
  
    try {
      const response = await axios.get(`https://api.mangadex.org${endpoint}`, {
        params: parsedParams,
        timeout: 10000, // 10 seconds timeout
        headers: {
          'User-Agent': 'MagiRead/1.0 (https://yourdomain.com)',
        },
        httpAgent: new (require("http").Agent)({ keepAlive: true }),
        httpsAgent: new (require("https").Agent)({ keepAlive: true }),
      });
  
      res.json(response.data);
    } catch (err) {
      console.error("MangaDex Proxy Error:", {
        message: err.message,
        data: err.response?.data,
        status: err.response?.status,
      });
  
      res.status(err.response?.status || 500).json({
        error: "Failed to fetch from MangaDex",
        details: err.response?.data || err.message,
      });
    }
});

module.exports = router;