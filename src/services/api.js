import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.mangadex.org'
});

// Existing API call for fetching the manga list
export const getMangaList = async (query = "", offset = 0, tag = "") => {
  const params = {
    title: query,
    limit: 90,
    offset: offset,
    includes: ["cover_art"],
    availableTranslatedLanguage: ["en"]
  };

  if (tag) {
    params["includedTags[]"] = tag;
  }

  const res = await API.get("/manga", { params });
  return res.data.data;
};

// Exporting getMangaById
export const getMangaById = async (id) => {
  const res = await API.get(`/manga/${id}`, {
    params: {
      includes: ["cover_art", "author", "artist", "tag", "creator"]
    }
  });
  return res.data.data;
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

// Fetch the details of a chapter based on its UUID
export const getChapterDetailsByUUID = async (chapterId) => {
  const res = await API.get(`/v2/chapters/${chapterId}`);
  return res.data.data;
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