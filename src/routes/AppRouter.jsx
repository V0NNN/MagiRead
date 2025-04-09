import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import MangaDetail from '../pages/MangaDetail';
import Reader from '../pages/Reader';

export default function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manga/:id" element={<MangaDetail />} />
        <Route path="/reader/:id/:chapterId" element={<Reader />} />
      </Routes>
    </BrowserRouter>
  );
}
