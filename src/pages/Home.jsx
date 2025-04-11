import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { HashLoader } from "react-spinners";
import { getLatestChapterByMangaId, getMangaList, getMangaById } from "../services/api";
import { useMangaCache } from "../context/MangaCacheContext";
import axios from "axios";

// Remove duplicate manga by unique key (ID + updatedAt)
const dedupeMangaList = (mangaArray) => {
  const seen = new Set();
  return mangaArray.filter((manga) => {
    const key = `${manga.id}-${manga.attributes?.updatedAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function Home({ isLoggingOut }) {
  const { 
    popularCache, setPopularCache, 
    updatesCache, setUpdatesCache 
  } = useMangaCache();

  const [popular, setPopular] = [popularCache, setPopularCache];
  const [updates, setUpdates] = [updatesCache, setUpdatesCache];
  const [myListChapters, setMyListChapters] = useState([]);
  const [user, setUser] = useState(null);
  const [pagePopular, setPagePopular] = useState(1);
  const [pageUpdates, setPageUpdates] = useState(1);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [loadedMangaIds, setLoadedMangaIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("userToken"));
  
  const fetchFollowedChapters = async () => {
    if (!token) return setMyListChapters([]);
    try {
      const [readingRes, customListRes] = await Promise.all([
        axios.get("/api/reading-status", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/custom-lists", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const ids = [
        ...readingRes.data.map((e) => e.mangaId),
        ...customListRes.data.flatMap((l) => l.mangaIds)
      ];
      const uniqueIds = [...new Set(ids)];

      const results = [];
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));

      console.log("🔍 unique followed manga IDs:", uniqueIds);
      for (const mangaId of uniqueIds) {
        console.log("manga IDs:", mangaId);

        try {
          const mangaRes = await getMangaById(mangaId);
          const manga = mangaRes?.data?.data;
          if (!manga) continue;

          const chapter = await getLatestChapterByMangaId(mangaId);

          if (chapter) {
            results.push({
              ...manga,
              latestChapter: {
                chapterNumber: chapter.chapterNumber || "N/A",
                updatedAt: chapter.updatedAt || new Date().toISOString()
              }
            });
          }
      
          console.log("🧾 Final Followed Manga Results:", results);
          await delay(1000);
      
        } catch (err) {
          console.warn(`Retry failed for manga ${mangaId}:`, err);
        }
      }

      results.sort((a, b) => new Date(b.latestChapter.updatedAt) - new Date(a.latestChapter.updatedAt));
      setMyListChapters(results);
    } catch (err) {
      console.error("Error fetching followed manga:", err);
    }
  };

  const loadFollowedMangaUpdates = useCallback(async () => {
    if (!token || loadingUpdates) return;
    setLoadingUpdates(true);

    try {
      const [readingRes, customListRes] = await Promise.all([
        axios.get("/api/reading-status", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/custom-lists", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const ids = [
        ...readingRes.data.map((e) => e.mangaId),
        ...customListRes.data.flatMap((l) => l.mangaIds)
      ];
      const newMangaIds = [...new Set(ids)].filter((id) => !loadedMangaIds.has(id)).slice(0, 10);

      const fetched = await Promise.all(
        newMangaIds.map(async (id) => {
          try {
            const res = await getMangaById(id);
            return res?.data?.data || null;
          } catch {
            return null;
          }
        })
      );

      setUpdates((prev) => dedupeMangaList([...prev, ...fetched.filter(Boolean)]));

      setLoadedMangaIds((prev) => {
        const updated = new Set(prev);
        newMangaIds.forEach((id) => updated.add(id));
        return updated;
      });
    } catch (err) {
      console.error("Error loading updates:", err);
    } finally {
      setLoadingUpdates(false);
    }
  }, [token, loadingUpdates, loadedMangaIds]);

  const getCoverUrl = (manga) => {
    const coverArt = manga.relationships.find((r) => r.type === "cover_art");
    const filename = coverArt?.attributes?.fileName;
    return filename
      ? `http://localhost:5000/api/image-proxy?url=https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
      : "https://placehold.co/256x360?text=No+Cover";
  };

  const scrollCarousel = (direction, id) => {
    const el = document.getElementById(id);
    const amount = 800;
    const duration = 600;
    const start = el.scrollLeft;
    const end = direction === "left" ? start - amount : start + amount;
    const startTime = performance.now();
    const animate = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      el.scrollLeft = start + (end - start) * progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const timeAgo = (updatedAt) => {
    const diff = Date.now() - new Date(updatedAt).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours < 24 ? `${hours} hours ago` : `${Math.floor(hours / 24)} days ago`;
  };

  const fetchManga = useCallback(async (filter, pageNum) => {
    const data = await getMangaList(filter, pageNum);
    if (filter === "hot") setPopular((prev) => [...prev, ...data]);
    else if (filter === "new") setUpdates((prev) => dedupeMangaList([...prev, ...data]));
  }, []);

  useEffect(() => {
    const handleUserLogin = () => {
      const token = localStorage.getItem("userToken");
      if (token) {
        setUser({ token });
        setPageUpdates(1);
        setUpdates([]);
        fetchManga("new", 1);

        console.log("🪪 Token exists, calling fetchFollowedChapters() - 1");
        fetchFollowedChapters();
      }
    };
    window.addEventListener("userLogin", handleUserLogin);
    return () => window.removeEventListener("userLogin", handleUserLogin);
  }, [fetchManga]);

  useEffect(() => {
    window.addEventListener("userLogout", () => setUser(null));
    return () => window.removeEventListener("userLogout", () => setUser(null));
  }, []);

  useEffect(() => {
    if (token) setUser({ token });
  }, []);

  useEffect(() => {
    fetchManga("hot", pagePopular);
  }, [pagePopular, fetchManga]);

  useEffect(() => {
    fetchManga("new", pageUpdates);
  }, [pageUpdates, fetchManga]);

  useEffect(() => {
    if (token) {
      fetchFollowedChapters();
      console.log("🪪 Token exists, calling fetchFollowedChapters() - 2");
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 &&
        !loadingUpdates
      ) {
        loadFollowedMangaUpdates();
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadingUpdates, loadFollowedMangaUpdates]);

  useEffect(() => {
    if (popular.length === 0) {
      fetchManga("hot", pagePopular);
    }
  }, [pagePopular, fetchManga]);
  
  useEffect(() => {
    if (updates.length === 0) {
      fetchManga("new", pageUpdates);
    }
  }, [pageUpdates, fetchManga]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <HashLoader color="#36d7b7" />
        <p className="mt-4 text-xl">Logging out...</p>
      </div>
    );
  }

  return (
    <div className="pt-10 px-0 pb-8 text-white bg-gray-900 min-h-screen w-full">
      {/* Section: New Chapters */}
      <section className="mt-12 px-20 py-6">
        <h2 className="text-2xl font-bold mb-4">New Chapters from Followed Comics</h2>
        {!user ? (
          <div className="text-center text-lg font-bold text-gray-500 pt-20">
            <p
              onClick={() => window.dispatchEvent(new Event("triggerLoginForm"))}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Login is required for this function.
            </p>
          </div>
        ) : myListChapters.length === 0 ? (
          <div className="text-center text-gray-500 pt-20">
            No new followed chapters.
          </div>
        ) : (
          <div className="relative">
            {/* Left Scroll Button */}
            <button
              onClick={() => scrollCarousel("left", "followed-carousel")}
              className="absolute left-0 top-0 bottom-0 w-12 text-white flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-600 z-10"
              style={{ height: "100%" }}
            >
              <div className="w-9 h-12 bg-gray-600 text-white flex items-center justify-center rounded-full">
                <FaChevronLeft size={20} />
              </div>
            </button>

            {/* Carousel */}
            <div id="followed-carousel" className="flex overflow-x-auto space-x-4 pb-2">
              {myListChapters.length === 0 ? (
                <p className="text-center text-gray-500 w-full">No new followed chapters.</p>
              ) : (
                myListChapters.map((manga) => {
                  const imageUrl = getCoverUrl(manga);

                  return (
                    <Link
                      key={`followed-${manga.id}`}
                      to={`/manga/${manga.id}`}
                      className="flex-shrink-0 w-[160px] bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
                    >
                      <img
                        src={imageUrl}
                        alt={manga.attributes.title?.en}
                        className="rounded-t w-full h-56 object-cover"
                      />
                      <div className="p-2 text-sm">
                        <h3 className="font-semibold line-clamp-2">{manga.attributes.title?.en || "Untitled"}</h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {manga.latestChapter
                            ? `Chap ${manga.latestChapter.chapterNumber} · ${timeAgo(manga.latestChapter.updatedAt)}`
                            : "No chapters"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => scrollCarousel("right", "followed-carousel")}
              className="absolute right-0 top-0 bottom-0 w-12 text-white flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-600 z-10"
              style={{ height: "100%" }}
            >
              <div className="w-9 h-12 bg-gray-600 text-white flex items-center justify-center rounded-full">
                <FaChevronRight size={20} />
              </div>
            </button>
          </div>
        )}
      </section>

      {/* Section: Most Recent Popular */}
      <section className="mt-12 px-20 py-6">
        <h2 className="text-2xl font-bold mb-4">Most Recent Popular</h2>
        <div className="relative">
          {/* Left Button */}
          <button
            onClick={() => scrollCarousel("left", "popular-carousel")}
            className="absolute left-0 top-0 bottom-0 w-12 text-white flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-600 z-10"
            style={{ height: "100%" }}
          >
            <div className="w-9 h-12 bg-gray-600 text-white flex items-center justify-center rounded-full">
              <FaChevronLeft size={20} />
            </div>
          </button>
          {/* Carousel */}
          <div
            id="popular-carousel"
            className="flex overflow-x-hidden space-x-4 pb-2"
          >
            {popular.slice(0, 90).map((manga) => {
              const imageUrl = getCoverUrl(manga);

              return (
                <Link
                  key={`popular-${manga.id}`}
                  to={`/manga/${manga.id}`}
                  className="flex-shrink-0 w-[160px] bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-600"
                >
                  <img
                    src={imageUrl}
                    alt={manga.attributes.title.en}
                    className="rounded-t w-full h-56 object-cover"
                  />
                  <div className="p-2 text-sm">
                    <h3 className="font-semibold line-clamp-2">{manga.attributes.title.en}</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {manga.attributes.lastChapter 
                        ? `Chap ${manga.attributes.lastChapter} · ${timeAgo(manga.attributes.updatedAt)}` 
                        : "No chapters available"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          {/* Right Button */}
          <button
            onClick={() => scrollCarousel("right", "popular-carousel")}
            className="absolute right-0 top-0 bottom-0 w-12 h-12 flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-600 z-10"
            style={{ height: "100%" }}
          >
            <div className="w-9 h-12 bg-gray-600 text-white flex items-center justify-center rounded-full">
              <FaChevronRight size={20} />
            </div>
          </button>
        </div>
      </section>

      {/* Section: Updates */}
      <section className="mt-12 px-20 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Updates</h2>
        </div>
        <div className="grid grid-cols-6 gap-4">
          {updates.length === 0 ? (
            <p className="text-center text-gray-500 w-full">Sorry, no updates available.</p>
          ) : (
            updates.map((manga) => {
              const imageUrl = getCoverUrl(manga);

              return (
                <Link
                  key={`update-${manga.id}-${pageUpdates}-${Math.random()}`} // Ensuring a unique key
                  to={`/manga/${manga.id}`}
                  className="bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
                >
                  <img
                    src={imageUrl}
                    alt={manga.attributes.title.en}
                    className="rounded-t w-full h-56 object-cover"
                  />
                  <div className="p-2 text-sm">
                    <h3 className="font-semibold line-clamp-2">{manga.attributes.title.en}</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      {manga.attributes.lastChapter 
                        ? `Chap ${manga.attributes.lastChapter} · ${timeAgo(manga.attributes.updatedAt)}` 
                        : "No chapters available"}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        {loading && (
          <div className="text-center text-gray-400 mt-4">Loading more...</div>
        )}
      </section>
    </div>
  );
}