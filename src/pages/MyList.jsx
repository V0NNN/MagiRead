import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyList = () => {
  const token = localStorage.getItem("userToken");
  const [readingStatuses, setReadingStatuses] = useState([]);
  const [customLists, setCustomLists] = useState([]);

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
      } catch (err) {
        console.error('Error fetching lists:', err);
      }
    };
  
    fetchLists();
  }, [token]);

  if (!token) {
    return (
      <div className="text-white p-10 text-center">
        <h1 className="text-2xl font-bold mb-4">My List</h1>
        <p className="text-gray-400">You must be logged in to view and manage your lists.</p>
      </div>
    );
  }

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-bold mb-4">My Reading List</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {readingStatuses.map((entry) => (
          <div key={entry._id} className="bg-gray-800 p-4 rounded shadow">
            <p className="font-semibold">Manga ID: {entry.mangaId}</p>
            <p>Status: {entry.status}</p>
            <Link to={`/manga/${entry.mangaId}`} className="text-blue-400 hover:underline">View</Link>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">My Custom Lists</h2>
      {customLists.map((list) => (
        <div key={list._id} className="mb-6">
          <h3 className="text-xl font-semibold mb-2">{list.name} ({list.visibility})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {list.mangaIds.map((id) => (
              <div key={id} className="bg-gray-700 p-4 rounded shadow">
                <p>Manga ID: {id}</p>
                <Link to={`/manga/${id}`} className="text-blue-400 hover:underline">View</Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MyList;