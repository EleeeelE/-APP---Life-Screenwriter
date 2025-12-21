import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomeView } from './features/home/HomeView';
import { CalendarView } from './features/calendar/CalendarView';
import { EditorView } from './features/editor/EditorView';
import { ReviewViewer } from './features/viewer/ReviewViewer';
import { ArchiveView } from './features/archive/ArchiveView';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/calendar" element={<CalendarView />} />
      <Route path="/editor/:date" element={<EditorView />} />
      <Route path="/review/:date" element={<ReviewViewer />} />
      <Route path="/archive" element={<ArchiveView />} />
      {/* Catch all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
