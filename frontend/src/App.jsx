import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import Folders from './pages/Folders';
import FolderDetails from './pages/FolderDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/folders" element={<Folders />} />
        <Route path="/folders/:id" element={<FolderDetails />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
};

export default App;
