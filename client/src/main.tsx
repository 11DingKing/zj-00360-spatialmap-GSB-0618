import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { FilterProvider } from './context/FilterContext';
import { BuildingProvider } from './context/BuildingContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FilterProvider>
        <BuildingProvider>
          <App />
        </BuildingProvider>
      </FilterProvider>
    </BrowserRouter>
  </React.StrictMode>
);
