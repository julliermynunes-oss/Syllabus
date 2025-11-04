import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SyllabusList from './components/SyllabusList';
import SyllabusForm from './components/SyllabusForm';
import CompetenciesManager from './components/CompetenciesManager';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/syllabi"
              element={
                <PrivateRoute>
                  <SyllabusList />
                </PrivateRoute>
              }
            />
            <Route
              path="/syllabus/new"
              element={
                <PrivateRoute>
                  <SyllabusForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/syllabus/edit/:id"
              element={
                <PrivateRoute>
                  <SyllabusForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/competencias"
              element={
                <PrivateRoute>
                  <CompetenciesManager />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

