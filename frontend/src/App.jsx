import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SupervisorPanel from './pages/SupervisorPanel';
import StudentPanel from './pages/StudentPanel';
import SchoolPanel from './pages/SchoolPanel';
import BusinessPanel from './pages/BusinessPanel';
import FileUploadPage from './pages/FileUploadPage';
import EditorPage from './pages/EditorPage';
import LogsPage from './pages/LogsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/supervisor" element={<SupervisorPanel />} />
        <Route path="/student" element={<StudentPanel />} />
        <Route path="/school" element={<SchoolPanel />} />
        <Route path="/business" element={<BusinessPanel />} />
        <Route path="/files" element={<FileUploadPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;