import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import HomePage from './pages/HomePage';
import CoachingPage from './pages/CoachingPage';
import CoursesPage from './pages/CoursesPage';
import GroupSessionsPage from './pages/GroupSessionsPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';
import AssessmentsPage from './pages/AssessmentsPage';
import ChatWidget from './components/ChatWidget';
import ConsentFormPage from './pages/ConsentFormPage';
import Notification from './components/Notification';
import ReschedulePage from './pages/ReschedulePage';
import WorkshopsPage from './pages/WorkshopsPage';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ScrollToTop />
          <Notification />
          <div className="flex flex-col min-h-screen bg-white">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/coaching" element={<CoachingPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/groupsessions" element={<GroupSessionsPage />} />
                <Route path="/workshops" element={<WorkshopsPage />} /> {/* New route for WorkshopsPage */}
                <Route path="/booking" element={<BookingPage />} />
                <Route path="/reschedule/:id" element={<ReschedulePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/consent" element={<ConsentFormPage />} />
              </Routes>
            </main>
            <Footer />
            <ChatWidget />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;