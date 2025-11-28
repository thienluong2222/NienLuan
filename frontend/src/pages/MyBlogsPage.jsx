import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X, Loader2 } from "lucide-react";
import { blogService } from "../services/api";

export const MyBlogsPage = ({ setCurrentPage }) => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Modal (Thêm/Sửa)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null); // Nếu null => Đang tạo mới
    const [formData, setFormData] = useState({ title: "", content: "" });

    // Fetch bài viết của tôi
    const fetchMyBlogs = () => {
        setLoading(true);
        blogService.getMyBlogs()
            .then(data => setBlogs(data || []))
            .catch(err => alert(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMyBlogs();
    }, []);

    // Xử lý mở Modal
    const handleOpenModal = (blog = null) => {
        if (blog) {
            setEditingBlog(blog);
            setFormData({ title: blog.title, content: blog.content });
        } else {
            setEditingBlog(null);
            setFormData({ title: "", content: "" });
        }
        setIsModalOpen(true);
    };

    // Xử lý Submit (Thêm hoặc Sửa)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBlog) {
                // Sửa
                await blogService.update(editingBlog._id, formData);
                alert("Cập nhật thành công!");
            } else {
                // Thêm mới
                await blogService.create(formData);
                alert("Đăng bài thành công!");
            }
            setIsModalOpen(false);
            fetchMyBlogs(); // Load lại danh sách
        } catch (err) {
            alert(err.message);
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này?")) {
            try {
                await blogService.delete(id);
                fetchMyBlogs();
            } catch (err) {
                alert(err.message);
            }
        }
    };

    if (loading) return <div className="text-center py-10 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <div>
                    <button onClick={() => setCurrentPage("profile")} className="text-gray-500 hover:text-blue-600 mb-2">&larr; Quay lại Profile</button>
                    <h2 className="text-3xl font-bold text-gray-800">Quản lý Blog của tôi</h2>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} /> Viết bài mới
                </button>
            </div>

            {blogs.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p>Bạn chưa có bài viết nào.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {blogs.map(blog => (
                        <div key={blog._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start hover:shadow-md transition">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{blog.title}</h3>
                                <p className="text-gray-600 line-clamp-2 mb-2">{blog.content}</p>
                                <span className="text-xs text-gray-400">{new Date(blog.created_at).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button 
                                    onClick={() => handleOpenModal(blog)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full" title="Sửa"
                                >
                                    <Edit size={20} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(blog._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full" title="Xóa"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg">{editingBlog ? "Chỉnh sửa bài viết" : "Viết bài mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="Nhập tiêu đề bài viết..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                                <textarea 
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-40"
                                    value={formData.content}
                                    onChange={e => setFormData({...formData, content: e.target.value})}
                                    placeholder="Nội dung bài viết..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                                <button className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">Lưu bài viết</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};