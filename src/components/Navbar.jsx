import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaChevronDown, FaSignOutAlt } from 'react-icons/fa'; // Added logout icon
import { motion, AnimatePresence } from 'framer-motion';
import { useMangaCache } from '../context/MangaCacheContext';

const CATEGORY_OPTIONS = [
  "Most Popular Webtoon Right Now",
  "Most Popular Manga Right Now",
  "Browse Comics by Genre",
  "Popular Publishers",
  "Popular Groups"
];

export default function Navbar({ onGenreSelect, searchResults, onSearch }) {
  const [query, setQuery] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // Avatar dropdown
  const [loginInput, setLoginInput] = useState("");
  const [passwordInput, setPasswordInput] = useState(""); // Password input for login
  const [loginFormVisible, setLoginFormVisible] = useState(false); // Track visibility of the login form
  const [isSignUp, setIsSignUp] = useState(false); // Switch between Sign-Up and Sign-In
  const [username, setUsername] = useState(""); // Added for sign-up
  const [email, setEmail] = useState(""); // Added for sign-up
  const [confirmPassword, setConfirmPassword] = useState(""); // Added for sign-up
  const [loginError, setLoginError] = useState(""); // Error state for login
  const [signUpError, setSignUpError] = useState(""); // Error state for sign-up
  const [user, setUser] = useState(null); // Track logged-in user
  const catRef = useRef();
  const dropRef = useRef();
  const searchContainerRef = useRef(); // Reference for the search container
  const navigate = useNavigate();
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false); // NEW
  const [highlightLogin, setHighlightLogin] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { setPopularCache, setUpdatesCache } = useMangaCache();

  // Check if user is logged in on initial load
  useEffect(() => {
    const token = localStorage.getItem("userToken");
  
    if (token) {
      const [, payload] = token.split('.');
      try {
        const decoded = JSON.parse(atob(payload));
        const now = Date.now() / 1000;
  
        if (decoded.exp && decoded.exp > now) {
          setUser({ token }); // ✅ Token is still valid
        } else {
          console.log('Token expired, logging out...');
          localStorage.removeItem("userToken");
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to decode token:', err);
        localStorage.removeItem("userToken");
        setUser(null);
      }
    }

    const handleTriggerLogin = () => {
      setLoginFormVisible(true);
      setDropdownOpen(false); // Close avatar dropdown if open
    };
  
    window.addEventListener("triggerLoginForm", handleTriggerLogin);
    return () => window.removeEventListener("triggerLoginForm", handleTriggerLogin);
  }, []);

  // Handle logout
  const handleLogout = () => {
    setIsLoggingOut(true);
    setPopularCache([]);     // Clear cache
    setUpdatesCache([]);     // Clear cache
    setTimeout(() => {
      localStorage.removeItem("userToken");
      setUser(null);
      setDropdownOpen(false);
      navigate("/");
      setIsLoggingOut(false); // reset after redirect
    }, 100);
  };

  // Handle login form submission
  const handleLoginSubmit = async () => {
    if (!loginInput || !passwordInput) {
      setHighlightLogin(true);
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usernameOrEmail: loginInput,
          password: passwordInput,
        }),
      });
  
      const data = await response.json();
      if (response.ok) {
        setLoginFormVisible(false);
        localStorage.setItem('userToken', data.token);
        window.dispatchEvent(new Event("userLogin"));
        setUser({ token: data.token });
        setLoginInput("");
        setPasswordInput("");
        setHighlightLogin(false);
        navigate(location.pathname === "/mylist" ? "/mylist" : "/");
      } else {
        setLoginError(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Login failed. Please check your credentials.");
    }
  };  

  const handleKeyDownLogin = (e) => {
    if (e.key === 'Enter') {
      handleLoginSubmit();
    }
  };

  // Handle sign-up form submission
  const handleSignUpSubmit = async () => {
    if (passwordInput !== confirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    const response = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password: passwordInput,
        confirmPassword,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setLoginFormVisible(false); // Close the form after successful sign-up
      setLoginInput(""); // Clear login input field
      setPasswordInput(""); // Clear password input field
      alert("User created successfully!");
    } else {
      setSignUpError(data.message); // Display sign-up error
    }
  };

  // Close search dropdowns and login form if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close category dropdown if clicked outside
      if (catRef.current && !catRef.current.contains(e.target) && categoryOpen) {
        setCategoryOpen(false);
      }

      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setSearchDropdownOpen(false);
      }
      if (
        dropRef.current &&
        !dropRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }

      // Close login form if clicked outside
      if (!e.target.closest('.login-form') && loginFormVisible) {
        setLoginFormVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [categoryOpen, loginFormVisible]);

  // Handle search query change
  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (onSearch) {
      onSearch(value); // If onSearch function is passed as a prop, call it
    }
  };

  // Handle Enter key press for search
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(query);
      }
      setSearchDropdownOpen(false);
      if (searchResults.length > 0) {
        navigate(`/manga/${searchResults[0]?.id}`);
      }
    }
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 w-full fixed top-0 left-0 right-0 z-50 shadow border-b border-gray-700">
      <div className="flex items-center justify-between gap-8 flex-wrap md:flex-nowrap">
        {/* Left: Brand */}
        <Link to="/" className="flex items-center gap-2 hover:text-gray-300">
          <img src="/favicon.ico" alt="logo" className="w-6 h-6" />
          <span className="font-bold text-lg">MagiReads</span>
        </Link>

        {/* Center: Search */}
        <div ref={searchContainerRef} className="relative flex-grow max-w-md hidden sm:block search-container">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search manga..."
            className="w-full pl-10 pr-20 py-2 rounded bg-gray-800 text-sm text-white placeholder:text-gray-400 outline-none border border-transparent focus:border-blue-500"
            value={query}
            onChange={handleSearch}
            onFocus={() => setSearchDropdownOpen(true)}
            onKeyDown={handleKeyDown}
          />

          {/* Search Results Dropdown */}
          {query && searchResults.length > 0 && searchDropdownOpen && (
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
                      onClick={() => handleMangaClick(result.id)} // Close dropdown and navigate
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
        <div className="flex items-center gap-8">
          {/* Categories */}
          <div ref={catRef} className="relative">
            <button
              onClick={() => setCategoryOpen((prev) => !prev)}
              className="hover:text-gray-300 flex items-center gap-1"
            >
              Categories <FaChevronDown className="text-xs" />
            </button>

            {/* Categories Dropdown with Animation */}
            <AnimatePresence>
              {categoryOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute mt-2 bg-gray-800 text-white rounded shadow-lg w-72 z-50 border border-gray-700"
                >
                  {CATEGORY_OPTIONS.map((label, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700"
                      onClick={() => {
                        onGenreSelect(label);
                        setCategoryOpen(false); // Close dropdown after selecting a category
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Button */}
          <button
            className="text-white hover:text-gray-300"
            onClick={() => alert('Filter clicked!')}
          >
            Filter
          </button>

          {/* My List Button */}
          <Link to="/mylist">
            <button className="text-white hover:text-gray-300">
              My List
            </button>
          </Link>

          {/* Avatar - Click to show login form */}
          <div ref={dropRef}>
            {user ? (
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)} // Toggle dropdown
                className="text-3xl"
              >
                <FaUserCircle />
              </button>
            ) : (
              <button
                onClick={() => setLoginFormVisible(true)} // Show login form when avatar is clicked
                className="text-3xl"
              >
                <FaUserCircle />
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={dropdownOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`navbar-logout-button-container rounded absolute right-6 top-16 bg-gray-800 shadow-lg border border-gray-700 z-50 ${
              dropdownOpen ? "block" : "hidden"
            }`}
          >
            <button
              onClick={handleLogout}
              className="navbar-logout-button bg-gray-800 text-red-500 w-full py-2 px-4 text-left hover:bg-gray-700"
            >
              <FaSignOutAlt /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Form */}
      <AnimatePresence>
        {loginFormVisible && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="login-form bg-gray-800 p-10 rounded-lg shadow-lg w-full sm:w-120 md:w-2/3 lg:w-2/4">
              <h2 className="pb-10 text-3xl text-center font-bold">
                {isSignUp ? 'Sign Up' : 'Login'}
              </h2>
              {isSignUp ? (
                <>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
                  />
                  {signUpError && (
                    <p className="text-red-500 mt-2 text-sm">{signUpError}</p>
                  )}
                  <button
                    onClick={handleSignUpSubmit}
                    className="w-full bg-blue-500 text-white py-2 rounded"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Username or Email"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    onKeyDown={handleKeyDownLogin}
                    className={`w-full p-3 mb-6 bg-gray-800 text-md border ${highlightLogin && !loginInput ? 'border-red-500' : 'border-gray-300'} rounded`}
                  />

                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={handleKeyDownLogin}
                    className={`w-full p-3 mb-6 bg-gray-800 text-md border ${highlightLogin && !passwordInput ? 'border-red-500' : 'border-gray-300'} rounded`}
                  />
                  {loginError && (
                    <p className="text-red-500 mt-2 text-sm">{loginError}</p>
                  )}
                  <button
                    onClick={handleLoginSubmit}
                    className="w-full bg-blue-500 text-white py-2 rounded"
                  >
                    Login
                  </button>
                </>
              )}

              <div className="text-center mt-4">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-500"
                >
                  {isSignUp ? 'Already have an account? Log in' : 'New here? Register'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}