// routes/manga.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const MANGADEX_API = "https://api.mangadex.org";

router.get("/proxy", async (req, res) => {
    const { endpoint, ...otherParams } = req.query;
  
    if (!endpoint) {
      return res.status(400).json({ error: "Missing endpoint parameter" });
    }
  
    // Convert specific parameters to arrays if they are not already
    const params = { ...otherParams };
    ['includes[]', 'availableTranslatedLanguage[]'].forEach((key) => {
      if (params[key] && !Array.isArray(params[key])) {
        params[key] = [params[key]];
      }
    });
  
    try {
      const response = await axios.get(`${MANGADEX_API}${endpoint}`, {
        params,
      });
      res.json(response.data);
    } catch (err) {
      console.error("MangaDex Proxy Error:", err.message);
      res.status(err.response?.status || 500).json({
        error: "Failed to fetch from MangaDex",
        details: err.response?.data || err.message,
      });
    }
});  

module.exports = router;