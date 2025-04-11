import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.mangadex.org/',
});

// Proxy-based MangaDex request with retries
const proxyRequest = async (params, retries = 3, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get('/api/manga/proxy', { params });
      return response.data.data;
    } catch (err) {
      console.warn(`Attempt ${attempt + 1} failed:`, err.message);
      if (attempt < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        return [];
      }
    }
  }
};

export const getMangaList = async (filter = "", page = 1) => {
  const params = {
    endpoint: "/manga",
    limit: 90,
    offset: (page - 1) * 90,
    includes: ["cover_art"],
    availableTranslatedLanguage: ["en"],
  };

  if (filter === "hot") {
    params["order[followedCount]"] = "desc";
  } else if (filter === "new") {
    params["order[latestUploadedChapter]"] = "desc";
  } else if (filter) {
    params.title = filter;
  }

  return await proxyRequest(params);
};

export const getMangaById = async (id) => {
  const params = {
    endpoint: `/manga/${id}`,
    includes: ['cover_art', 'author', 'artist', 'tag', 'creator'],
  };
  return await proxyRequest(params);
};

export const getChaptersByMangaId = async (id, limit = 100, offset = 0) => {
  const params = {
    endpoint: '/chapter',
    manga: id,
    limit,
    offset,
    includes: ['user'],
  };
  return await proxyRequest(params);
};

export const getLatestChapterByMangaId = async (mangaId) => {
  const params = {
    endpoint: '/chapter',
    manga: mangaId,
    limit: 1,
    translatedLanguage: ['en'],
    'order[updatedAt]': 'desc',
  };

  const result = await proxyRequest(params);
  const chapter = result[0];
  if (!chapter) return null;

  return {
    id: chapter.id,
    chapterNumber: chapter.attributes.chapter,
    updatedAt: chapter.attributes.updatedAt,
  };
};

export const getPagesByChapterId = async (chapterId) => {
  const params = {
    endpoint: `/at-home/server/${chapterId}`,
  };
  const res = await axios.get('/api/manga/proxy', { params });
  return res.data;
};

export const registerUser = async (username, password) => {
  const body = { username, password };
  const res = await API.post('/auth/register', body, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const loginUser = async (username, password) => {
  const body = { username, password };
  const res = await API.post('/auth/login', body, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
};

export const getUserInfo = async (token) => {
  const res = await API.get('/user/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
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
  const params = {
    endpoint: '/manga',
    ids,
    includes: ['cover_art'],
  };
  return await proxyRequest(params);
};