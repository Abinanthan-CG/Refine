import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Excalidraw from './pages/Excalidraw/Excalidraw';
import BlockNote from './pages/BlockNote/BlockNote';
import NotFound from './pages/NotFound/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main layout wrapper */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="excalidraw" element={<Excalidraw />} />
          <Route path="blocknote" element={<BlockNote />} />
          {/* Custom animated 404 page */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
