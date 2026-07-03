/**
 * Electron renderer entry point — boots the data source, then mounts the App.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/geist';
import App from './App';
import { bootDataSource } from '@/data/datasource/db-source';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

bootDataSource().then(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
