// --- FILE: frontend/src/App.jsx ---
import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authService } from "./services/api";

// Import các Component con
import { Navbar } from "./components/Navbar";

// [CẬP NHẬT] Import từ các file riêng biệt
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

import { CoursesPage } from "./pages/CoursesPage";
import { FlashcardsPage } from "./pages/FlashcardsPage";
import { BlogsPage } from "./pages/BlogsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { MyBlogsPage } from "./pages/MyBlogsPage";
import { AdminPage } from "./pages/AdminPage";

export default function App() {
    const [currentPage, setCurrentPage] = useState("home");
    const [user, setUser] = useState(null);
    const [appLoading, setAppLoading] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const res = await authService.getProfile();
                    if (res && res.user) {
                        setUser(res.user);
                        // Nếu đang ở trang login mà F5, và là admin -> vào admin
                        if (res.user.role === 'admin' && currentPage === 'login') {
                           setCurrentPage('admin');
                        }
                    }
                } catch (err) {
                    localStorage.removeItem("token");
                }
            }
            setAppLoading(false);
        };
        checkLogin();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(null);
        setCurrentPage("home");
    };

    const renderContent = () => {
        switch (currentPage) {
            case "home": return <HomePage setCurrentPage={setCurrentPage} />;
            case "courses": return <CoursesPage user={user} />;
            case "flashcards": return <FlashcardsPage />;
            case "blogs": return <BlogsPage />; 
            case "profile": return <ProfilePage user={user} setCurrentPage={setCurrentPage} />;
            case "my-blogs": return <MyBlogsPage setCurrentPage={setCurrentPage} />;
            
            // Route Admin
            case "admin": 
                if (user?.role === 'admin') return <AdminPage user={user} handleLogout={handleLogout} setCurrentPage={setCurrentPage} />;
                return <HomePage setCurrentPage={setCurrentPage} />;
            
            case "login": return <LoginPage setUser={setUser} setCurrentPage={setCurrentPage} />;
            default: return <HomePage setCurrentPage={setCurrentPage} />;
        }
    };

    if (appLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={50} /></div>

    // Nếu ở trang Admin thì ẩn Navbar mặc định đi cho đỡ rối (AdminPage có Sidebar riêng)
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            {currentPage !== 'admin' && <Navbar setCurrentPage={setCurrentPage} user={user} handleLogout={handleLogout} />}
            <main className={currentPage !== 'admin' ? "pb-10" : ""}>{renderContent()}</main>
        </div>
    );
}