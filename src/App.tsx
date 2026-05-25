import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import NotFound from './pages/NotFound/NotFound';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Main layout wrapper */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* Custom animated 404 page */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

