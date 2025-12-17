// --- FILE: frontend/src/App.jsx ---
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authService } from "./services/api";

import { Navbar } from "./components/Navbar";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { CoursesPage } from "./pages/CoursesPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { BlogsPage } from "./pages/BlogsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MyBlogsPage } from "./pages/MyBlogsPage";
import { AdminPage } from "./pages/AdminPage";
import { ExamsPage } from "./pages/ExamsPage";
import { TeacherProfilePage } from "./pages/TeacherProfilePage";
import { CourseDetailPage } from "./pages/CourseDetailPage";

export default function App() {
    const [currentPage, setCurrentPage] = useState("home");
    const [currentCourseId, setCurrentCourseId] = useState(null);
    const [user, setUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);

    const fetchUserInfo = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const res = await authService.getProfile();
                if (res && res.user) {
                    setUser(res.user);
                    if (res.user.role === "admin" && currentPage === "login") {
                        setCurrentPage("admin");
                    }
                }
            } catch (err) {
                localStorage.removeItem("token");
                setUser(null);
            }
        } else {
            setUser(null);
        }
        setAppLoading(false);
    };

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setCurrentPage("home");
    };

    const navigateToCourseDetail = (courseId) => {
        setCurrentCourseId(courseId);
        setCurrentPage("course-detail");
    };

    const renderContent = () => {
        switch (currentPage) {
            case "home":
                return <HomePage setCurrentPage={setCurrentPage} />;
            case "courses":
                return <CoursesPage user={user} refreshUser={fetchUserInfo} onViewDetail={navigateToCourseDetail} />;
            
            case "course-detail":
                return <CourseDetailPage user={user} courseId={currentCourseId} onBack={() => setCurrentPage('courses')} />;

            case "flashcards":
                return <FlashcardsPage />;
            case "blogs":
                return <BlogsPage />;
            
            case "profile":
                // [UPDATED] Truyền onViewDetail và refreshUser vào ProfilePage
                return <ProfilePage user={user} setCurrentPage={setCurrentPage} onViewDetail={navigateToCourseDetail} refreshUser={fetchUserInfo} />;
            
            case "teacher-profile":
                // [UPDATED] Truyền onViewDetail vào TeacherProfilePage
                if (user?.role === 'teacher')
                    return <TeacherProfilePage user={user} setCurrentPage={setCurrentPage} onViewDetail={navigateToCourseDetail} />;
                return <HomePage setCurrentPage={setCurrentPage} />;

            case "my-blogs":
                return <MyBlogsPage setCurrentPage={setCurrentPage} />;
            case "exams":
                return <ExamsPage user={user} />;

            case "admin":
                if (user?.role === "admin")
                    return <AdminPage user={user} handleLogout={handleLogout} setCurrentPage={setCurrentPage} />;
                return <HomePage setCurrentPage={setCurrentPage} />;

            case "login":
                return <LoginPage setUser={setUser} setCurrentPage={setCurrentPage} refreshUser={fetchUserInfo} />;
            default:
                return <HomePage setCurrentPage={setCurrentPage} />;
        }
    };

    if (appLoading)
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50} /></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {currentPage !== "admin" && <Navbar setCurrentPage={setCurrentPage} user={user} handleLogout={handleLogout} />}
            <main className={currentPage !== "admin" ? "pb-10" : ""}>{renderContent()}</main>
        </div>
    );
}