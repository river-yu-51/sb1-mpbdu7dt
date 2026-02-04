import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import CoachingPage from "./pages/CoachingPage";
import CoursesPage from "./pages/CoursesPage";
import GroupSessionsPage from "./pages/GroupSessionsPage";
import BookingPage from "./pages/BookingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AuthCallback from "./pages/AuthCallback";
import AccountPage from "./pages/AccountPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import ChatWidget from "./components/ChatWidget";
import ConsentFormPage from "./pages/ConsentFormPage";
import Notification from "./components/Notification";
import ReschedulePage from "./pages/ReschedulePage";
import WorkshopsPage from "./pages/WorkshopsPage";
import FAQPage from "./pages/FAQpage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminHomePage from "./pages/admin/AdminHomePage";
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminFaqsPage from "./pages/admin/AdminFaqsPage";
import AdminAvailabilityPage from "./pages/admin/AdminAvailabilityPage";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
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
              <Route path="/workshops" element={<WorkshopsPage />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/reschedule/:id" element={<ReschedulePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/faq" element={<FAQPage/>} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/consent" element={<ConsentFormPage />} />
              <Route path="/consent/view" element={<ConsentFormPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminHomePage />} />
                <Route path="availability" element={<AdminAvailabilityPage />} />
                <Route path="services" element={<AdminServicesPage />} />
                <Route path="faqs" element={<AdminFaqsPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
          <ChatWidget />
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
