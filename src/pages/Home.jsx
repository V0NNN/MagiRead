import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaFire, FaSun } from "react-icons/fa"; // Import icons
import { getMangaList } from "../services/api"; // Example API call

export default function Home() {
  const [newChapters, setNewChapters] = useState([]);
  const [popular, setPopular] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [user, setUser] = useState(null); // Placeholder for user authentication (replace with actual auth)
  const [selectedFilter, setSelectedFilter] = useState("hot"); // State to track selected filter
  const [loading, setLoading] = useState(false); // State to track if more data is loading
  const [page, setPage] = useState(1); // State for the current page of API data
  const [pagePopular, setPagePopular] = useState(1); // Separate page state for hot
  const [pageUpdates, setPageUpdates] = useState(1); // Separate page state for new chapters

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

  // Ensure updates are loaded when the page first loads
  useEffect(() => {
    // On page load, fetch the data based on the default filter (hot)
    if (selectedFilter === "hot") {
      fetchManga("hot", pagePopular); // Load popular manga for "hot"
    } else if (selectedFilter === "new") {
      fetchManga("new", pageUpdates); // Load new chapters for "new"
    }
  }, [selectedFilter, pagePopular, pageUpdates, fetchManga]); // Depend on selected filter and page state


  

  // Handle button clicks for "Hot" or "New"
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter); // Set the new filter
    setPage(1); // Reset the global page state to 1 when switching filters
  
    if (filter === "hot") {
      setPageUpdates(1); // Reset pageUpdates when switching to "hot"
      setUpdates([]); // Clear the updates section
    } else {
      setPagePopular(1); // Reset pagePopular when switching to "new"
      setPopular([]); // Clear the popular section
    }
  };
  

  const handleScrollPopular = (event) => {
    const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
    if (bottom && !loading) {
      setPagePopular((prev) => prev + 1); // Increment page for popular
    }
  };
  
  const handleScrollUpdates = (event) => {
    const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
    if (bottom && !loading) {
      setPageUpdates((prev) => prev + 1); // Increment page for updates
    }
  };

  // Scroll handler to load more manga when reaching the bottom
  const handleScroll = (event) => {
    const bottom = event.target.scrollHeight === event.target.scrollTop + event.target.clientHeight;
    if (bottom && !loading) {
      setPage((prev) => prev + 1); // Increment page number to fetch more manga
    }
  };

  // Handle button visibility based on scroll position
  const handleScrollLeft = (carouselId) => {
    const carousel = document.getElementById(carouselId);
    carousel.scrollLeft -= 400;
  };

  const handleScrollRight = (carouselId) => {
    const carousel = document.getElementById(carouselId);
    carousel.scrollLeft += 400;
  };

  return (
    <div className="pt-20 px-0 pb-8 text-white bg-gray-900 min-h-screen w-full" onScroll={handleScroll}>
      {/* Section: New Chapters */}
      <section className="mt-12 px-20 py-6">
        <h2 className="text-2xl font-bold mb-4">New Chapters from Followed Comics</h2>
        {!user ? (
          <div className="text-center text-lg font-bold text-gray-500">
            <Link to="/login" className="text-blue-400 hover:underline">Login is required for this function.</Link>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleScrollLeft("carousel")}
              className="text-white bg-gray-700 rounded-full p-2 hover:bg-gray-600"
            >
              &lt;
            </button>
            <div id="carousel" className="flex overflow-x-hidden space-x-4 pb-2">
              {newChapters.length === 0 ? (
                <p className="text-center text-gray-500 w-full">Sorry, no new chapters available.</p>
              ) : (
                newChapters.slice(0, 10).map((manga) => {
                  const coverArt = manga.relationships.find((r) => r.type === "cover_art");
                  const filename = coverArt?.attributes?.fileName;
                  const imageUrl = filename
                    ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                    : "https://placehold.co/256x360?text=No+Cover";

                  return (
                    <Link
                      key={`new-${manga.id}-${selectedFilter}-${page}-${Math.random()}`}
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
                })
              )}
            </div>
            <button
              onClick={() => handleScrollRight("carousel")}
              className="text-white bg-gray-700 rounded-full p-2 hover:bg-gray-600"
            >
              &gt;
            </button>
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
                  key={`popular-${manga.id}-hot`}
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
          <div className="flex items-center space-x-4">
            <button
              className={`${
                selectedFilter === "hot" ? "bg-red-500 text-white" : "bg-gray-700 text-gray-300"
              } rounded py-1 px-4 hover:bg-red-400 flex items-center`}
              onClick={() => handleFilterChange("hot")}
            >
              <FaFire className="mr-2" /> Hot
            </button>
            <button
              className={`${
                selectedFilter === "new" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
              } rounded py-1 px-4 hover:bg-blue-400 flex items-center`}
              onClick={() => handleFilterChange("new")}
            >
              <FaSun className="mr-2" /> New
            </button>
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

              return (
                <Link
                  key={`update-${manga.id}-${selectedFilter}-${pageUpdates}`} // Ensure unique key for updates
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
                    <p className="text-gray-400 text-xs mt-1">Chap {manga.attributes.chapter} · x hours ago</p>
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
