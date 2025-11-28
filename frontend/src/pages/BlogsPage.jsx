// --- FILE: frontend/src/pages/BlogsPage.jsx ---
import React, { useState, useEffect } from "react";
import { User, MessageSquare, Loader2 } from "lucide-react";
import { blogService } from "../services/api";

export const BlogsPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        blogService.getAll().then(data => setBlogs(data || [])).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin text-purple-600" size={40} /></div>;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-3xl font-bold mb-8 text-gray-800 border-l-4 border-purple-600 pl-4">Bài viết & Chia sẻ</h2>
            <div className="grid gap-6">
                {blogs.map(blog => (
                    <div key={blog._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                            <User size={14} /> <span>{blog.author}</span>
                            <span>•</span>
                            <span>{new Date(blog.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3">{blog.title}</h3>
                        <p className="text-gray-600 whitespace-pre-line">{blog.content}</p>
                        <div className="mt-4 flex gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MessageSquare size={14}/> {blog.comments?.length || 0} bình luận</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};