import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // Added chevron icons for carousel buttons
import { getMangaList } from "../services/api"; // Example API call

export default function Home() {
  const [newChapters, setNewChapters] = useState([]);
  const [popular, setPopular] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [user, setUser] = useState(null); // Placeholder for user authentication (replace with actual auth)
  const [loading, setLoading] = useState(false); // State to track if more data is loading
  const [pagePopular, setPagePopular] = useState(1); // Separate page state for hot
  const [pageUpdates, setPageUpdates] = useState(1); // Separate page state for new chapters

  // Function to calculate how many hours ago a chapter was uploaded
  const timeAgo = (publishedAt) => {
    const timeDiff = Date.now() - new Date(publishedAt).getTime();
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    return `${hours} hours ago`;
  };

  // Fetch data on load
  const fetchManga = useCallback((filter, pageNum) => {
    setLoading(true);
    getMangaList(filter, pageNum).then((data) => {
      if (filter === "hot") {
        setPopular((prev) => [...prev, ...data]); // Append data to popular
      } else if (filter === "new") {
        setUpdates((prev) => [...prev, ...data]); // Append data to updates
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchManga("new", pageUpdates); // Load new chapters for "new"
  }, [pageUpdates, fetchManga]);

  useEffect(() => {
    fetchManga("hot", pagePopular); // Load popular manga for "hot"
  }, [pagePopular, fetchManga]);

  const scrollCarousel = (direction) => {
    const carousel = document.getElementById("popular-carousel");
    const scrollAmount = 800; // Distance to scroll per click
    const duration = 600; // Duration in ms for the scroll
    const start = carousel.scrollLeft;
    const end =
      direction === "left"
        ? start - scrollAmount
        : start + scrollAmount;
    const startTime = performance.now();
  
    const animateScroll = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1); // Progress from 0 to 1
      carousel.scrollLeft = start + (end - start) * progress;
  
      if (elapsed < duration) {
        requestAnimationFrame(animateScroll); // Keep animating until the duration is reached
      }
    };
  
    // Start the animation
    requestAnimationFrame(animateScroll);
  };

  return (
    <div className="pt-20 px-0 pb-8 text-white bg-gray-900 min-h-screen w-full">
      {/* Section: New Chapters */}
      <section className="mt-12 px-20 py-6">
        <h2 className="text-2xl font-bold mb-4">New Chapters from Followed Comics</h2>
        {!user ? (
          <div className="text-center text-lg font-bold text-gray-500">
            <Link to="/login" className="text-blue-400 hover:underline">Login is required for this function.</Link>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <div id="carousel" className="flex overflow-x-hidden space-x-4 pb-2">
              {updates.length === 0 ? (
                <p className="text-center text-gray-500 w-full">Sorry, no new chapters available.</p>
              ) : (
                updates.slice(0, 90).map((manga) => {
                  const coverArt = manga.relationships.find((r) => r.type === "cover_art");
                  const filename = coverArt?.attributes?.fileName;
                  const imageUrl = filename
                    ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                    : "https://placehold.co/256x360?text=No+Cover";

                  return (
                    <Link
                      key={`new-${manga.id}-${pageUpdates}-${Math.random()}`} // Ensuring a unique key
                      to={`/manga/${manga.id}`}
                      className="flex-shrink-0 w-[160px] bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200"
                    >
                      <img
                        src={imageUrl}
                        alt={manga.attributes.title.en}
                        className="rounded-t w-full h-56 object-cover"
                      />
                      <div className="p-2 text-sm">
                        <h3 className="font-semibold line-clamp-2">{manga.attributes.title.en}</h3>
                        <p className="text-gray-400 text-xs mt-1">
                          {manga.attributes.chapter ? `Chap ${manga.attributes.chapter} · ${timeAgo(manga.attributes.publishedAt)}` : "No chapters available"}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* Section: Most Recent Popular */}
      <section className="mt-12 px-20 py-6">
        <h2 className="text-2xl font-bold mb-4">Most Recent Popular</h2>
        <div className="relative">
          {/* Left Button */}
          <button
            onClick={() => scrollCarousel("left")}
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
                      {manga.attributes.chapter 
                        ? `Chap ${manga.attributes.chapter} · ${timeAgo(manga.attributes.publishedAt)}` 
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
                      {manga.attributes.chapter 
                        ? `Chap ${manga.attributes.chapter} · ${timeAgo(manga.attributes.publishedAt)}` 
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