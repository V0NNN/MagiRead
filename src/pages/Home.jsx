import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaSun } from "react-icons/fa"; // Remove Hot toggle
import { getMangaList } from "../services/api"; // Example API call

export default function Home() {
  const [newChapters, setNewChapters] = useState([]);
  const [popular, setPopular] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [user, setUser] = useState(null); // Placeholder for user authentication (replace with actual auth)
  const [loading, setLoading] = useState(false); // State to track if more data is loading
  const [page, setPage] = useState(1); // State for the current page of API data
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
      console.log('API Response for updates (new chapters):', data); // Log the API response

      if (filter === "hot") {
        setPopular((prev) => [...prev, ...data]); // Append data to popular
      } else if (filter === "new") {
        setUpdates((prev) => [...prev, ...data]); // Append data to updates
      }
      setLoading(false);
    });
  }, []);

  // Ensure updates are loaded when the page first loads
  useEffect(() => {
    fetchManga("new", pageUpdates); // Load new chapters for "new" on page load
  }, [pageUpdates, fetchManga]); // Depend on pageUpdates state to fetch new data

  useEffect(() => {
    fetchManga("hot", pagePopular); // Load popular manga for "hot"
  }, [pagePopular, fetchManga]); // Depend on pagePopular state to fetch popular data

  // Scroll handler to load more manga when reaching the bottom
  const handleScrollUpdates = (event) => {
    const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
    if (bottom && !loading) {
      setPageUpdates((prev) => prev + 1); // Increment page for updates
    }
  };

  // Scroll handler for popular manga
  const handleScrollPopular = (event) => {
    const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
    if (bottom && !loading) {
      setPagePopular((prev) => prev + 1); // Increment page for popular
    }
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
                updates.slice(0, 10).map((manga) => {
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
                        {/* Display the latest chapter and time ago */}
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
      <section className="mt-12 px-20 py-6" onScroll={handleScrollPopular}>
        <h2 className="text-2xl font-bold mb-4">Most Recent Popular</h2>
        <div className="relative">
          <button
            onClick={() => document.getElementById("popular-carousel").scrollLeft -= 200}
            className="absolute left-0 top-0 bottom-0 w-12 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-200"
            style={{ height: "100%" }}
          >
            &lt;
          </button>
          <div id="popular-carousel" className="flex overflow-x-hidden space-x-4 pb-2">
            {popular.slice(0, 10).map((manga) => {
              const coverArt = manga.relationships.find((r) => r.type === "cover_art");
              const filename = coverArt?.attributes?.fileName;
              const imageUrl = filename
                ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                : "https://placehold.co/256x360?text=No+Cover";
              return (
                <Link
                  key={`popular-${manga.id}-hot-${Math.random()}`} // Ensuring a unique key
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
                    <p className="text-gray-400 text-xs mt-1">Chap ?? · x hours ago</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => document.getElementById("popular-carousel").scrollLeft += 200}
            className="absolute right-0 top-0 bottom-0 w-12 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 hover:opacity-80 transition-all duration-200"
            style={{ height: "100%" }}
          >
            &gt;
          </button>
        </div>
      </section>

      {/* Section: Updates */}
      <section className="mt-12 px-20 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Updates</h2>
          <div
            className={`${
              "bg-blue-500 text-white"
            } rounded py-1 px-4 flex items-center`}
          >
            <FaSun className="mr-2" /> New
          </div>
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
            
              // Ensure unique key by adding a random number and pageUpdates
              return (
                <Link
                  key={`update-${manga.id}-${pageUpdates}-${Math.random()}`} // Use pageUpdates and Math.random() to ensure uniqueness
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
                      Chap {manga.attributes.chapter} · {timeAgo(manga.attributes.publishedAt)}
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