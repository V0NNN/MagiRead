import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MangaDetail from './pages/MangaDetail';
import Reader from './pages/Reader';
import MyList from './pages/MyList';
import Navbar from './components/Navbar';
import { getMangaList } from './services/api';

export default function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 🔧 Add this line

  const handleSearch = async (query) => {
    if (query) {
      const results = await getMangaList(query);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <Router>
      <Navbar onSearch={handleSearch} searchResults={searchResults} setIsLoggingOut={setIsLoggingOut} />
      <Routes>
        <Route path="/" element={<Home isLoggingOut={isLoggingOut} />} /> {/* ✅ Updated */}
        <Route path="/manga/:id" element={<MangaDetail />} />
        <Route path="/reader/:mangaId/:chapterId" element={<Reader />} />
        <Route path="/mylist" element={<MyList />} />
      </Routes>
    </Router>
  );
}