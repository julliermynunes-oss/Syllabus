import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SyllabusList from './components/SyllabusList';
import SyllabusForm from './components/SyllabusForm';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
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
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

