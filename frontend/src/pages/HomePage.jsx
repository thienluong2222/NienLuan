import React from 'react';
import { BookOpen, Layers, PenTool } from 'lucide-react';

export const HomePage = ({ setCurrentPage }) => (
    <div className="text-center py-16 bg-gradient-to-b from-blue-50 to-gray-50 min-h-[80vh]">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-6">Hệ thống Quản lý Khóa học Tiếng Anh</h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Nền tảng học tập toàn diện.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 container mx-auto px-4">
            <div onClick={() => setCurrentPage("courses")} className="bg-white p-8 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition hover:-translate-y-1 border border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-blue-600 flex justify-center items-center gap-2"><BookOpen size={32} /> Khóa học</h3>
            </div>
            <div onClick={() => setCurrentPage("flashcards")} className="bg-white p-8 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition hover:-translate-y-1 border border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-green-600 flex justify-center items-center gap-2"><Layers size={32} /> Flashcards</h3>
            </div>
            <div onClick={() => setCurrentPage("blogs")} className="bg-white p-8 rounded-xl shadow-md cursor-pointer hover:shadow-xl transition hover:-translate-y-1 border border-gray-100">
                <h3 className="text-2xl font-bold mb-4 text-purple-600 flex justify-center items-center gap-2"><PenTool size={32} /> Blog</h3>
            </div>
        </div>
    </div>
);