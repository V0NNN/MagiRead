import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getMangaBulk } from '../services/api'; // Import the bulk fetcher

const MyList = () => {
  const token = localStorage.getItem("userToken");
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [createError, setCreateError] = useState('');
  const [readingMangaData, setReadingMangaData] = useState([]);
  const [customMangaData, setCustomMangaData] = useState({});

  useEffect(() => {
    if (!token) return;
  
    const fetchLists = async () => {
      try {
        const [statusRes, customListRes] = await Promise.all([
          axios.get('/api/reading-status', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('/api/custom-lists', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
  
        setReadingStatuses(statusRes.data);
        setCustomLists(customListRes.data);

        // Fetch manga info for reading list
        const readingIds = statusRes.data.map(entry => entry.mangaId);
        const readingDetails = await getMangaBulk(readingIds);
        setReadingMangaData(readingDetails);

        // Fetch manga info for each custom list
        const customMap = {};
        for (const list of customListRes.data) {
          if (list.mangaIds.length > 0) {
            const mangaInfo = await getMangaBulk(list.mangaIds);
            customMap[list._id] = mangaInfo;
          }
        }
        setCustomMangaData(customMap);
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
  
    fetchLists();
  }, [token]);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setCreateError('List name is required');
      return;
    }
  
    try {
      await axios.post('/api/custom-lists', {
        name: newListName,
        visibility,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      setNewListName('');
      setVisibility('private');
      setCreateError('');
      // Refetch lists
      const updated = await axios.get('/api/custom-lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomLists(updated.data);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create list');
    }
  };

  const handleRemoveReading = async (mangaId) => {
    try {
      await axios.delete(`/api/reading-status/${mangaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReadingStatuses(prev => prev.filter(entry => entry.mangaId !== mangaId));
    } catch (err) {
      console.error('Failed to remove from reading list:', err);
    }
  };

  const handleRemoveFromCustomList = async (listId, mangaId) => {
    try {
      const list = customLists.find(l => l._id === listId);
      if (!list) return;
  
      const updatedIds = list.mangaIds.filter(id => id !== mangaId);
      await axios.put(`/api/custom-lists/${listId}`, { mangaIds: updatedIds }, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Update local state
      setCustomLists(prev =>
        prev.map(list =>
          list._id === listId
            ? { ...list, mangaIds: updatedIds }
            : list
        )
      );
    } catch (err) {
      console.error('Failed to remove from custom list:', err);
    }
  };

  if (!token) {
    return (
      <div className="text-white p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">My List</h1>
        <p className="text-gray-400">You must be logged in to view and manage your lists.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-20">
      <div className="bg-gray-800 p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Create a Custom List</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="List Name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full sm:w-1/3"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full sm:w-1/4"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <button
            onClick={handleCreateList}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create
          </button>
        </div>
        {createError && <p className="text-red-400 mt-2">{createError}</p>}
      </div>

      <h1 className="text-2xl font-bold mb-4">My Reading List</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {readingMangaData.map((manga) => {
          const coverArt = manga.relationships.find(r => r.type === 'cover_art');
          const filename = coverArt?.attributes?.fileName;
          const coverUrl = filename
            ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
            : 'https://placehold.co/128x192?text=No+Cover';

          const status = readingStatuses.find(s => s.mangaId === manga.id)?.status;

          return (
            <div key={manga.id} className="bg-gray-800 p-4 rounded shadow relative">
              <img src={coverUrl} alt="cover" className="w-24 h-36 rounded mb-2" />
              <p className="font-semibold">{manga.attributes.title?.en || 'Untitled'}</p>
              <p className="text-sm text-gray-400 capitalize">Status: {status}</p>
              <Link to={`/manga/${manga.id}`} className="text-blue-400 hover:underline">View</Link>
              <button
                onClick={() => handleRemoveReading(manga.id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">My Custom Lists</h2>
      {customLists.map((list) => (
        <div key={list._id} className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{list.name} ({list.visibility})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(customMangaData[list._id] || []).map((manga) => {
              const coverArt = manga.relationships.find(r => r.type === 'cover_art');
              const filename = coverArt?.attributes?.fileName;
              const coverUrl = filename
                ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                : 'https://placehold.co/128x192?text=No+Cover';

              return (
                <div key={manga.id} className="bg-gray-700 p-4 rounded shadow relative">
                  <img src={coverUrl} alt="cover" className="w-24 h-36 rounded mb-2" />
                  <p className="font-semibold">{manga.attributes.title?.en || 'Untitled'}</p>
                  <Link to={`/manga/${manga.id}`} className="text-blue-400 hover:underline">View</Link>
                  <button
                    onClick={() => handleRemoveFromCustomList(list._id, manga.id)}
                    className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyList;