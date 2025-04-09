import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import Reader from './pages/Reader';
import MyList from './pages/MyList';
import Navbar from './components/Navbar';
import { getMangaList } from './services/api'; // Import the API function

export default function App() {
  const [searchResults, setSearchResults] = useState([]);

  // Define the search function
  const handleSearch = async (query) => {
    if (query) {
      // Call the API to fetch manga based on the search query
      const results = await getMangaList(query);
      setSearchResults(results); // Update the search results with API data
    } else {
      setSearchResults([]); // If no query, clear the results
    }
  };

  return (
    <Router>
      {/* Pass the search functionality and search results to Navbar */}
      <Navbar onSearch={handleSearch} searchResults={searchResults} />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manga/:id" element={<MangaDetail />} />
          <Route path="/reader/:mangaId/:chapterId" element={<Reader />} />
          <Route path="/my-list" element={<MyList />} />
        </Routes>
      </div>
    </Router>
  );
}
