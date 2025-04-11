import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getMangaBulk } from '../services/api';
import { handleApiError } from '../utils/handleApiError';
import { FaBookOpen, FaListUl, FaChevronDown, FaChevronRight, FaTrash, FaEdit, FaMinusSquare, FaPlusSquare } from 'react-icons/fa';

const MyList = () => {
  const [userToken, setUserToken] = useState(localStorage.getItem("userToken"));
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [newListName, setNewListName] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [createError, setCreateError] = useState('');
  const [readingMangaData, setReadingMangaData] = useState([]);
  const [customMangaData, setCustomMangaData] = useState({});
  const [tokenExpiredMessage, setTokenExpiredMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [collapsedLists, setCollapsedLists] = useState({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState('');
  const [editingListVisibility, setEditingListVisibility] = useState('');

  useEffect(() => {
    const handleUserLogin = () => {
      const newToken = localStorage.getItem("userToken");
      setUserToken(newToken);
    };
    window.addEventListener("userLogin", handleUserLogin);
    return () => window.removeEventListener("userLogin", handleUserLogin);
  }, []);

  useEffect(() => {
    if (!userToken) return;
    const fetchLists = async () => {
      try {
        const [statusRes, customListRes] = await Promise.all([
          axios.get('/api/reading-status', {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
          axios.get('/api/custom-lists', {
            headers: { Authorization: `Bearer ${userToken}` },
          }),
        ]);
        setReadingStatuses(statusRes.data);
        setCustomLists(customListRes.data);
        const readingIds = statusRes.data.map(entry => entry.mangaId);
        const readingDetails = await getMangaBulk(readingIds);
        setReadingMangaData(readingDetails);
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
        handleApiError(err, null, setTokenExpiredMessage);
      }
    };
    fetchLists();
  }, [userToken]);

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
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setNewListName('');
      setVisibility('private');
      setCreateError('');
      const updated = await axios.get('/api/custom-lists', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setCustomLists(updated.data);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create list');
    }
  };

  const handleRemoveReading = async (mangaId) => {
    try {
      await axios.delete(`/api/reading-status/${mangaId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setReadingMangaData((prev) => prev.filter((m) => m.id !== mangaId));
    } catch (err) {
      console.error("Failed to remove from reading list:", err);
    }
  };

  const handleRemoveFromCustomList = async (listId, mangaId) => {
    try {
      const list = customLists.find((l) => l._id === listId);
      if (!list) return;
      const updatedIds = list.mangaIds.filter((id) => id !== mangaId);
      await axios.put(`/api/custom-lists/${listId}`, { mangaIds: updatedIds }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setCustomMangaData((prev) => {
        const updated = { ...prev };
        updated[listId] = updated[listId].filter((m) => m.id !== mangaId);
        return updated;
      });
    } catch (err) {
      console.error("Failed to remove from custom list:", err);
    }
  };

  const handleEditCustomList = async (listId) => {
    try {
      await axios.put(`/api/custom-lists/${listId}`, {
        name: editingListName,
        visibility: editingListVisibility
      }, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const updated = await axios.get('/api/custom-lists', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setCustomLists(updated.data);
      setEditingListId(null);
    } catch (err) {
      console.error("Failed to update custom list:", err);
    }
  };

  const toggleCollapseAll = () => {
    const toggled = !allCollapsed;
    const updated = {};
    customLists.forEach(list => {
      updated[list._id] = toggled;
    });
    setCollapsedLists(updated);
    setAllCollapsed(toggled);
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const filteredReading = readingMangaData.filter((manga) => {
    const status = readingStatuses.find(s => s.mangaId === manga.id)?.status;
    const hasStatus = filterStatus ? formatStatus(status) === filterStatus : true;
    const hasGenre = filterGenre ? manga.attributes?.tags?.some(tag => tag.attributes?.name?.en === filterGenre) : true;
    return hasStatus && hasGenre;
  });

  const allStatuses = Array.from(new Set(readingStatuses.map(s => formatStatus(s.status))));
  const allGenres = Array.from(new Set(readingMangaData.flatMap(m => m.attributes?.tags?.map(tag => tag.attributes?.name?.en)).filter(Boolean)));

  if (!userToken) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <p className="text-2xl text-gray-300 text-center">
          <button
            onClick={() => window.dispatchEvent(new Event("triggerLoginForm"))}
            className="text-blue-400 hover:underline"
          >
            Login
          </button>
          <span className="ml-1">to view and manage your lists.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-20">
      {tokenExpiredMessage && (
        <div className="bg-red-500 text-white px-4 py-2 rounded mb-4 text-center">
          {tokenExpiredMessage}
        </div>
      )}

      <div className="flex items-center justify-between mt-12 mb-4">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><FaBookOpen /> My Reading List</h1>
        <div className="flex gap-4">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-gray-800 text-white p-2 rounded">
            <option value="">All Statuses</option>
            {allStatuses.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>
          <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} className="bg-gray-800 text-white p-2 rounded">
            <option value="">All Genres</option>
            {allGenres.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {filteredReading.map((manga) => {
          const coverArt = manga.relationships.find(r => r.type === 'cover_art');
          const filename = coverArt?.attributes?.fileName;
          const coverUrl = filename
            ? `http://localhost:5000/api/image-proxy?url=https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
            : 'https://placehold.co/128x192?text=No+Cover';
          const status = readingStatuses.find(s => s.mangaId === manga.id)?.status;
          return (
            <Link
              key={manga.id}
              to={`/manga/${manga.id}`}
              className="w-[160px] bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200 relative"
            >
              <img src={coverUrl} alt={manga.attributes.title?.en} className="rounded-t w-full h-56 object-cover" />
              <div className="p-2 text-sm">
                <h3 className="font-semibold line-clamp-2">{manga.attributes.title?.en || "Untitled"}</h3>
                {status && <p className="text-gray-400 text-xs mt-1">Status: {formatStatus(status)}</p>}
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveReading(manga.id); }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-xs text-white px-2 py-1 rounded"
              >Remove</button>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-12 mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2"><FaListUl /> My Custom Lists</h2>
        <button onClick={toggleCollapseAll} className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-600">
          {allCollapsed ? (<><FaPlusSquare className="inline mr-1" /> Expand All</>) : (<><FaMinusSquare className="inline mr-1" /> Collapse All</>)}
        </button>
      </div>

      {customLists.map((list) => (
        <div key={list._id} className="mb-6">
          <div className="flex items-center justify-between">
            {editingListId === list._id ? (
              <div className="flex gap-2 mb-2">
                <input type="text" value={editingListName} onChange={(e) => setEditingListName(e.target.value)} className="bg-gray-700 p-1 rounded" />
                <select value={editingListVisibility} onChange={(e) => setEditingListVisibility(e.target.value)} className="bg-gray-700 p-1 rounded">
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <button onClick={() => handleEditCustomList(list._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">Save</button>
                <button onClick={() => setEditingListId(null)} className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs">Cancel</button>
              </div>
            ) : (
              <h3 className="text-xl font-semibold mb-2 cursor-pointer flex items-center" onClick={() => setCollapsedLists(prev => ({ ...prev, [list._id]: !prev[list._id] }))}>
                {collapsedLists[list._id] ? <FaChevronRight className="mr-2" /> : <FaChevronDown className="mr-2" />}
                {list.name}
                <span className={`ml-2 ${list.visibility === 'private' ? 'text-red-400' : 'text-green-400'}`}>({list.visibility})</span>
              </h3>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setEditingListId(list._id); setEditingListName(list.name); setEditingListVisibility(list.visibility); }} className="text-blue-400 hover:text-blue-600 text-sm flex items-center gap-1"><FaEdit /> Edit</button>
              <button onClick={() => handleRemoveCustomList(list._id)} className="text-red-400 hover:text-red-600 text-sm flex items-center gap-1"><FaTrash /> Delete</button>
            </div>
          </div>

          {!collapsedLists[list._id] && (
            <div className="flex flex-wrap gap-4">
              {(customMangaData[list._id] || []).map((manga) => {
                const coverArt = manga.relationships.find(r => r.type === 'cover_art');
                const filename = coverArt?.attributes?.fileName;
                const coverUrl = filename
                  ? `http://localhost:5000/api/image-proxy?url=https://uploads.mangadex.org/covers/${manga.id}/${filename}.256.jpg`
                  : 'https://placehold.co/128x192?text=No+Cover';
                return (
                  <Link
                    key={manga.id}
                    to={`/manga/${manga.id}`}
                    className="w-[160px] bg-gray-800 rounded-md shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200 relative"
                  >
                    <img src={coverUrl} alt={manga.attributes.title?.en} className="rounded-t w-full h-56 object-cover" />
                    <div className="p-2 text-sm">
                      <h3 className="font-semibold line-clamp-2">{manga.attributes.title?.en || "Untitled"}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFromCustomList(list._id, manga.id); }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-xs text-white px-2 py-1 rounded"
                    >Remove</button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div className="bg-gray-800 p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">Create a Custom List</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            placeholder="List Name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full sm:w-2/3"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="bg-gray-700 p-2 rounded w-full sm:w-1/3"
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
    </div>
  );
};

export default MyList;