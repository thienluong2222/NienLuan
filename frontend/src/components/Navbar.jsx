// --- FILE: frontend/src/components/Navbar.jsx ---
import React from 'react';
import { BookOpen, User, LogOut } from 'lucide-react';

// SỬA LỖI: Dùng 'export const' thay vì 'const export'
export const Navbar = ({ setCurrentPage, user, handleLogout }) => (
    <nav className="bg-blue-600 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <div
                className="text-xl font-bold cursor-pointer flex items-center gap-2"
                onClick={() => setCurrentPage("home")}
            >
                <BookOpen size={24} /> ThienCourse
            </div>
            <div className="hidden md:flex space-x-4 items-center">
                <button onClick={() => setCurrentPage("home")} className="hover:text-blue-200 font-medium">Trang chủ</button>
                <button onClick={() => setCurrentPage("courses")} className="hover:text-blue-200 font-medium">Khóa học</button>
                <button onClick={() => setCurrentPage("flashcards")} className="hover:text-blue-200 font-medium">Flashcards</button>
                <button onClick={() => setCurrentPage("blogs")} className="hover:text-blue-200 font-medium">Blog</button>

                {user ? (
                    <div className="flex items-center gap-3 ml-4 border-l pl-4 border-blue-400">
                        <div 
                            onClick={() => setCurrentPage("profile")}
                            className="flex items-center gap-2 cursor-pointer hover:text-blue-200"
                        >
                            <User size={18} />
                            <span className="font-bold">{user.username}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 px-3 py-1 rounded text-sm hover:bg-red-600 flex items-center gap-1 shadow-sm"
                        >
                            <LogOut size={16} /> Thoát
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setCurrentPage("login")}
                        className="bg-white text-blue-600 px-4 py-1 rounded font-bold hover:bg-gray-100 shadow-sm"
                    >
                        Đăng nhập
                    </button>
                )}
            </div>
        </div>
    </nav>
);