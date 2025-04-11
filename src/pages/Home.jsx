import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // Added chevron icons for carousel buttons
import { HashLoader } from "react-spinners";
import { getLatestChapterByMangaId } from "../services/api";
import { getMangaList } from "../services/api";
import axios from "axios";

export default function Home({ isLoggingOut }) {
  const [newChapters, setNewChapters] = useState([]);
  const [popular, setPopular] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [user, setUser] = useState(null); // Placeholder for user authentication (replace with actual auth)
  const [loading, setLoading] = useState(false); // State to track if more data is loading
  const [pagePopular, setPagePopular] = useState(1); // Separate page state for hot
  const [pageUpdates, setPageUpdates] = useState(1); // Separate page state for new chapters
  const [myListChapters, setMyListChapters] = useState([]);

  const fetchFollowedChapters = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) {
      setMyListChapters([]);
      return;
    }
  
    try {
      const [readingRes, customListRes] = await Promise.all([
        axios.get("/api/reading-status", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/custom-lists", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      const readingIds = readingRes.data.map((entry) => entry.mangaId);
      const customIds = customListRes.data.flatMap((list) => list.mangaIds);
      const uniqueMangaIds = [...new Set([...readingIds, ...customIds])];
  
      const delay = (ms) => new Promise((res) => setTimeout(res, ms));
      const results = [];
  
      for (const mangaId of uniqueMangaIds) {
        try {
          let mangaData = null;
          let attempt = 0;
          const maxRetries = 3;
      
          while (attempt < maxRetries) {
            try {
              const mangaRes = await axios.get(`https://api.mangadex.org/manga/${mangaId}?includes[]=cover_art`);
              mangaData = mangaRes.data.data;
              break;
            } catch (err) {
              console.warn(`Retry ${attempt + 1} for manga ${mangaId}:`, err.message);
              attempt++;
              await delay(1000 * attempt); // linear backoff
            }
          }
      
          if (!mangaData) continue;
      
          const chapterInfo = await getLatestChapterByMangaId(mangaId);
          if (chapterInfo) {
            results.push({ ...mangaData, latestChapter: chapterInfo });
          }
      
          await delay(1000); // <-- INCREASE to 1s per request
        } catch (innerErr) {
          console.error(`Failed to fetch manga/chapter for ${mangaId}:`, innerErr.message);
        }
      }
      
  
      const sorted = results
        .filter((m) => m.latestChapter)
        .sort((a, b) => new Date(b.latestChapter.updatedAt) - new Date(a.latestChapter.updatedAt));
  
      setMyListChapters(sorted);
    } catch (error) {
      console.error("Error fetching followed chapters:", error);
    }
  };
  

  // Function to calculate how many hours ago a chapter was uploaded
  const timeAgo = (updatedAt) => {
    const timeDiff = Date.now() - new Date(updatedAt).getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} days ago`;
    }
  };

  // Fetch data on load
  const fetchManga = useCallback(async (filter, pageNum) => {
    setLoading(true);
    const data = await getMangaList(filter, pageNum); // safely wrapped now
    if (filter === "hot") {
      setPopular((prev) => [...prev, ...data]);
    } else if (filter === "new") {
      setUpdates((prev) => [...prev, ...data]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleUserLogin = () => {
      const token = localStorage.getItem("userToken");
      if (token) {
        setUser({ token });
        setPageUpdates(1); // Reset
        setUpdates([]);    
        fetchManga("new", 1);
        fetchFollowedChapters();
      }
    };
  
    window.addEventListener("userLogin", handleUserLogin);
    return () => window.removeEventListener("userLogin", handleUserLogin);
  }, [fetchManga]);

  useEffect(() => {
    const handleUserLogout = () => {
      setUser(null);
      setMyListChapters([]);
    };
  
    window.addEventListener("userLogout", handleUserLogout);
    return () => window.removeEventListener("userLogout", handleUserLogout);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      setUser({ token });
    }
  }, []);

  useEffect(() => {
    fetchManga("new", pageUpdates); // Load new chapters for "new"
  }, [pageUpdates, fetchManga]);

  useEffect(() => {
    fetchManga("hot", pagePopular); // Load popular manga for "hot"
  }, [pagePopular, fetchManga]);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token) {
      fetchFollowedChapters();
    }
  }, []);

  const scrollCarousel = (direction, id = "popular-carousel") => {
    const carousel = document.getElementById(id);
    const scrollAmount = 800;
    const duration = 600;
    const start = carousel.scrollLeft;
    const end = direction === "left" ? start - scrollAmount : start + scrollAmount;
    const startTime = performance.now();
  
    const animateScroll = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      carousel.scrollLeft = start + (end - start) * progress;
  
      if (elapsed < duration) {
        requestAnimationFrame(animateScroll);
      }
    };
  
    requestAnimationFrame(animateScroll);
  };

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
                  const coverArt = manga.relationships.find((r) => r.type === "cover_art");
                  const filename = coverArt?.attributes?.fileName;
                  const imageUrl = filename
                    ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                    : "https://placehold.co/256x360?text=No+Cover";

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
            onClick={() => scrollCarousel("left", "followed-carousel")}
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
              const coverArt = manga.relationships.find((r) => r.type === "cover_art");
              const filename = coverArt?.attributes?.fileName;
              const imageUrl = filename
                ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                : "https://placehold.co/256x360?text=No+Cover";
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
            onClick={() => scrollCarousel("right")}
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
              const coverArt = manga.relationships.find((r) => r.type === "cover_art");
              const filename = coverArt?.attributes?.fileName;
              const imageUrl = filename
                ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                : "https://placehold.co/256x360?text=No+Cover";

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