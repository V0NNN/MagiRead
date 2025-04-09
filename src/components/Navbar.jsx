import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_OPTIONS = [
  "Most Popular Webtoon Right Now",
  "Most Popular Manga Right Now",
  "Browse Comics by Genre",
  "Popular Publishers",
  "Popular Groups"
];

export default function Navbar({ onGenreSelect, searchResults, onSearch }) {
  const { user, login, logout } = useAuth();
  const [query, setQuery] = useState(""); 
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginInput, setLoginInput] = useState("");
  const [results, setResults] = useState([]); 
  const catRef = useRef();
  const dropRef = useRef();
  const navigate = useNavigate(); 

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close dropdown if click is outside of the search container or dropdown
      if (
        catRef.current &&
        !catRef.current.contains(e.target) &&
        !e.target.closest('.search-container') &&
        !e.target.closest('.search-results')
      ) {
        setDropdownOpen(false); 
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown when navigating to MangaDetail page
  useEffect(() => {
    setDropdownOpen(false); 
  }, [navigate]);

  // Handle search query change
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (onSearch) {
      onSearch(value);
    }
  };

  useEffect(() => {
    if (searchResults) {
      setResults(searchResults);
    }
  }, [searchResults]);

  // Handle Enter key press for search and navigate to the first result
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(query);
      }
      setDropdownOpen(false); 
      if (results.length > 0) {
        navigate(`/manga/${results[0]?.id}`);
      }
    }
  };

  const handleLinkClick = () => {
    setDropdownOpen(false); 
  };

  // Handle when user clicks a manga from the search results
  const handleMangaClick = (mangaId) => {
    setDropdownOpen(false);
    navigate(`/manga/${mangaId}`);
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 w-full fixed top-0 left-0 right-0 z-50 shadow border-b border-gray-700">
      <div className="flex items-center justify-between gap-4 flex-wrap md:flex-nowrap">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2 hover:text-gray-300">
          <img src="/favicon.ico" alt="logo" className="w-6 h-6" />
          <span className="font-bold text-lg">MagiReads</span>
        </Link>

        {/* Center: Search */}
        <div className="relative flex-grow max-w-md hidden sm:block search-container">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search manga..."
            className="w-full pl-10 pr-20 py-2 rounded bg-gray-800 text-sm text-white placeholder:text-gray-400 outline-none border border-transparent focus:border-blue-500"
            value={query}
            onChange={handleSearch}
            onFocus={() => setDropdownOpen(true)} // Open dropdown when focus on input
            onKeyDown={handleKeyDown}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hidden md:block">
            Ctrl K
          </span>

          {/* Search Results Dropdown */}
          {query && searchResults.length > 0 && dropdownOpen && (
            <div
              className="absolute top-full left-0 w-[200%] mt-2 bg-gray-800 text-white rounded shadow-lg z-50 max-h-80 overflow-y-auto search-results"
              style={{ left: '50%', transform: 'translateX(-50%)' }}
            >
              <ul className="overflow-hidden">
                {searchResults.map((result, index) => {
                  const title = result.attributes?.title?.en || "No Title";
                  const description = result.attributes?.description?.en || "No description available.";
                  const coverImage = result.relationships?.find(r => r.type === "cover_art")?.attributes?.fileName;
                  const coverImageUrl = coverImage ? `https://uploads.mangadex.org/covers/${result.id}/${coverImage}` : 'https://placehold.co/50x75';

                  return (
                    <li
                      key={index}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleMangaClick(result.id)} // Navigate when clicked
                    >
                      <img
                        src={coverImageUrl} 
                        alt={title} 
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="text-sm">
                        <span>{title}</span>
                        <p className="text-xs text-gray-400 line-clamp-2">{description}</p> 
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Links & Dropdowns */}
        <div className="flex items-center gap-4">
          {/* Categories */}
          <div ref={catRef} className="relative">
            <button
              onClick={() => setCategoryOpen((prev) => !prev)}
              className="hover:text-gray-300 flex items-center gap-1"
            >
              Categories <FaChevronDown className="text-xs" />
            </button>
            <AnimatePresence>
              {categoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-8 right-0 bg-gray-800 text-white rounded shadow w-64 z-50 border border-gray-700"
                >
                  {CATEGORY_OPTIONS.map((label, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700"
                      onClick={() => {
                        onGenreSelect(label);
                        setCategoryOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <Link to="/" className="hover:text-gray-300">Search</Link>
          <Link to="/my-list" className="hover:text-gray-300">Bookmarks</Link>

          {/* User Dropdown */}
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="text-2xl"
            >
              <FaUserCircle />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg p-2 space-y-1 z-50">
                {!user ? (
                  <>
                    <input
                      className="w-full p-2 text-sm border border-gray-300 rounded"
                      placeholder="Username"
                      value={loginInput}
                      onChange={(e) => setLoginInput(e.target.value)}
                    />
                    <button
                      className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                      onClick={() => login(loginInput)}
                    >
                      Login
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-2 py-1 text-sm text-gray-800">Hi, {user.username}</div>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      onClick={logout}
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}