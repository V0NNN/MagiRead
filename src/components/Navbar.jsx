import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaChevronDown } from 'react-icons/fa';
import { loginUser } from '../services/api'; // Import loginUser from api.js
import { motion, AnimatePresence } from 'framer-motion';

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
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginError, setLoginError] = useState(""); // Error state for login
  const [signUpError, setSignUpError] = useState(""); // Error state for sign-up
  const catRef = useRef();
  const dropRef = useRef();
  const searchContainerRef = useRef(); // Reference for the search container
  const navigate = useNavigate(); 

  // Close search dropdowns and login form if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close category dropdown if clicked outside
      if (catRef.current && !catRef.current.contains(e.target) && categoryOpen) {
        setCategoryOpen(false);
      }

      // Close search dropdown if clicked outside
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setDropdownOpen(false); // Close search dropdown
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
      onSearch(value);
    }
  };

  // Handle Enter key press for search
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

  // Handle login form submission
  const handleLoginSubmit = async () => {
    try {
      const response = await loginUser(loginInput, passwordInput); // Call the loginUser API function
      console.log('Login successful:', response);
      setLoginFormVisible(false); // Close login form after successful login
      localStorage.setItem('userToken', response.token);
      navigate('/'); // Navigate to home after successful login
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError("Login failed. Please check your credentials."); // Set error message
    }
  };

  // Handle sign-up form submission
  const handleSignUpSubmit = async () => {
    if (passwordInput !== confirmPassword) {
      setSignUpError("Passwords do not match.");
      return;
    }

    // Check if username or email already exists
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

    if (response.ok) {
      setLoginFormVisible(false);
      alert('User created successfully!');
    } else {
      const data = await response.json();
      setSignUpError(data.message);
    }
  };

  // Handle when user clicks a manga from the search results
  const handleMangaClick = (mangaId) => {
    setDropdownOpen(false); // Close the dropdown before navigating
    navigate(`/manga/${mangaId}`); // Navigate to MangaDetail page
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
                  style={{
                    right: '-120%',
                    top: '120%',
                    transform: 'translateX(-50%)',
                  }}
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
          <div ref={dropRef} className="relative">
            <button
              onClick={() => setLoginFormVisible(true)} // Show login form when avatar is clicked
              className="text-2xl"
            >
              <FaUserCircle />
            </button>
          </div>
        </div>
      </div>

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
              <h2 className='pb-10 text-3xl text-center font-bold'>{isSignUp ? 'Sign Up' : 'Login'}</h2>
              {/* Switch between Sign-In and Sign-Up */}
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
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full p-3 mb-6 bg-gray-800 text-md border border-gray-300 rounded"
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
              
              {/* Link to switch forms */}
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