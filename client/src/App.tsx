import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MapPage from './pages/MapPage';
import AddBuilding from './pages/AddBuilding';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/add" element={<AddBuilding />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
}
