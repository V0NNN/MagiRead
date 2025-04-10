import axios from 'axios';

const API = axios.create({
  baseURL: 'https://api.mangadex.org'
});

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


export const getMangaById = async (id) => {
  const res = await API.get(`/manga/${id}`, {
    params: {
      includes: ["cover_art"]
    }
  });
  return res.data.data;
};

export const getChaptersByMangaId = async (id) => {
  const res = await API.get(`/chapter?manga=${id}&translatedLanguage[]=en`);
  return res.data.data;
};

export const getPagesByChapterId = async (chapterId) => {
  const res = await API.get(`/at-home/server/${chapterId}`);
  return res.data;
};