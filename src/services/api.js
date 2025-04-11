import axios from 'axios';

const apiUrl = "https://api.mangadex.org/";

const API = axios.create({
  baseURL: apiUrl,
});

// Existing API call for fetching the manga list
export const getMangaList = async (filter = "", page = 1, retries = 3, delay = 1000) => {
  const params = {
    endpoint: "/manga",
    title: filter,
    limit: 90,
    offset: (page - 1) * 90,
    includes: ["cover_art"],
    availableTranslatedLanguage: ["en"],
  };

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get("/api/manga/proxy", { params });
      return response.data.data;
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed for getMangaList:`, err.message);
      if (attempt < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        return [];
      }
    }
  }
};

// Exporting getMangaById
export const getMangaById = async (id) => {
  const response = await axios.get("/api/manga/proxy", {
    params: {
      endpoint: `/manga/${id}`,
      includes: ["cover_art", "author", "artist", "tag", "creator"],
    },
  });
  return response.data.data;
};

// Fetching chapters based on manga ID
export const getChaptersByMangaId = async (id, limit = 100, offset = 0) => {
  const res = await API.get(`/chapter`, {
    params: {
      manga: id,
      limit: limit,       // Increase this number to fetch more chapters
      offset: offset,     // For pagination, adjust the offset as needed
      includes: ["user"]  // Include relationships if necessary
    }
  });
  return res.data.data;
};

// Fetch the most recent English-translated chapter for a manga by its ID
export const getLatestChapterByMangaId = async (mangaId) => {
  try {
    const response = await axios.get(
      `https://api.mangadex.org/chapter?manga=${mangaId}&limit=1&translatedLanguage[]=en&order[updatedAt]=desc`
    );

    const chapter = response.data.data[0];
    if (!chapter) return null;

    return {
      id: chapter.id,
      chapterNumber: chapter.attributes.chapter,
      updatedAt: chapter.attributes.updatedAt,
    };
  } catch (error) {
    console.error("Error fetching latest chapter:", error);
    return null;
  }
};

// Exporting getPagesByChapterId
export const getPagesByChapterId = async (chapterId) => {
  const res = await API.get(`/at-home/server/${chapterId}`);
  return res.data;
};

// User Signup (POST request to MangaDex API)
export const registerUser = async (username, password) => {
  const body = {
    username: username,
    password: password
  };
  const res = await API.post('/auth/register', body, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return res.data; // Return the response data which contains the user data and JWT token
};

// Login function for MangaDex (POST request to MangaDex API)
export const loginUser = async (username, password) => {
  const body = {
    username: username,
    password: password
  };

  try {
    const res = await API.post('/auth/login', body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return res.data; // Return the response data which contains the user info and JWT token
  } catch (error) {
    throw new Error("Login failed. Please check your credentials.");
  }
};

// Function to get current user info (requires authentication)
export const getUserInfo = async (token) => {
  const res = await API.get('/user/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return res.data; // Return the user data
};

export const updateReadingStatus = (mangaId, status, token) =>
  axios.post(`/api/reading-status/${mangaId}`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createCustomList = (name, visibility, token) =>
  axios.post('/api/custom-lists', { name, visibility }, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateCustomList = (listId, mangaIds, token) =>
  axios.put(`/api/custom-lists/${listId}`, { mangaIds }, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCustomLists = (token) =>
  axios.get('/api/custom-lists', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMangaBulk = async (ids = []) => {
  if (ids.length === 0) return [];

  const res = await axios.get(`https://api.mangadex.org/manga`, {
    params: {
      ids,
      includes: ['cover_art'],
    },
  });

  return res.data.data;
};