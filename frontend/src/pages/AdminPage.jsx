// --- FILE: frontend/src/pages/AdminPage.jsx ---
import React, { useState, useEffect } from "react";
import { 
    LayoutDashboard, Users, BookOpen, Layers, PenTool, 
    Trash2, LogOut, ArrowLeft, Plus, X 
} from "lucide-react";
import { adminService, courseService, flashcardService, blogService } from "../services/api";

export const AdminPage = ({ user, handleLogout, setCurrentPage }) => {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [stats, setStats] = useState({ users: 0, courses: 0, flashcards: 0, blogs: 0 });
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(false);

    // State cho Modal Thêm Mới
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { 
        if (activeTab !== "dashboard") fetchDataForTab(activeTab); 
    }, [activeTab]);

    const fetchStats = async () => {
        try { const data = await adminService.getStats(); setStats(data); } catch (err) {}
    };

    const fetchDataForTab = async (tab) => {
        setLoading(true);
        try {
            let data = [];
            if (tab === "users") data = await adminService.getAllUsers();
            if (tab === "courses") data = await courseService.getAll();
            if (tab === "flashcards") data = await flashcardService.getAll();
            if (tab === "blogs") data = await blogService.getAll();
            setDataList(data || []);
        } catch (err) { alert(err.message); } 
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa mục này?")) return;
        try {
            if (activeTab === "users") await adminService.deleteUser(id);
            if (activeTab === "courses") await courseService.delete(id);
            if (activeTab === "flashcards") await flashcardService.delete(id);
            if (activeTab === "blogs") await blogService.delete(id);
            fetchDataForTab(activeTab); fetchStats();
        } catch (err) { alert(err.message); }
    };

    // --- XỬ LÝ THÊM MỚI ---
    const handleOpenModal = () => {
        setFormData({}); // Reset form
        setIsModalOpen(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            if (activeTab === "users") await adminService.createUser(formData);
            if (activeTab === "courses") await courseService.create(formData);
            if (activeTab === "flashcards") await flashcardService.create(formData);
            if (activeTab === "blogs") await blogService.create(formData);
            
            alert("Thêm mới thành công!");
            setIsModalOpen(false);
            fetchDataForTab(activeTab);
            fetchStats();
        } catch (err) {
            alert(err.message);
        }
    };

    // --- RENDER FORM TRONG MODAL ---
    const renderFormFields = () => {
        switch (activeTab) {
            case "users":
                return (
                    <>
                        <input className="w-full border p-2 rounded mb-3" placeholder="Tên đăng nhập" onChange={e => setFormData({...formData, username: e.target.value})} required />
                        <input className="w-full border p-2 rounded mb-3" type="password" placeholder="Mật khẩu" onChange={e => setFormData({...formData, password: e.target.value})} required />
                        <select className="w-full border p-2 rounded mb-3" onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="user">Người dùng (User)</option>
                            <option value="admin">Quản trị viên (Admin)</option>
                        </select>
                    </>
                );
            case "courses":
                return (
                    <>
                        <input className="w-full border p-2 rounded mb-3" placeholder="Tên khóa học" onChange={e => setFormData({...formData, title: e.target.value})} required />
                        <input className="w-full border p-2 rounded mb-3" placeholder="Giá (VNĐ)" type="number" onChange={e => setFormData({...formData, price: e.target.value})} required />
                        <input className="w-full border p-2 rounded mb-3" placeholder="Lịch học (VD: 2-4-6)" onChange={e => setFormData({...formData, schedule: e.target.value})} required />
                        <input className="w-full border p-2 rounded mb-3" placeholder="Trình độ (VD: Cơ bản)" onChange={e => setFormData({...formData, level: e.target.value})} required />
                        <textarea className="w-full border p-2 rounded mb-3" placeholder="Mô tả chi tiết" onChange={e => setFormData({...formData, description: e.target.value})} />
                    </>
                );
            case "flashcards":
                return (
                    <>
                        <input className="w-full border p-2 rounded mb-3" placeholder="Tên bộ thẻ" onChange={e => setFormData({...formData, title: e.target.value})} required />
                        <p className="text-sm text-gray-500 mb-2">Lưu ý: Bộ thẻ sẽ được tạo rỗng, bạn có thể thêm thẻ chi tiết sau.</p>
                    </>
                );
            case "blogs":
                return (
                    <>
                        <input className="w-full border p-2 rounded mb-3" placeholder="Tiêu đề bài viết" onChange={e => setFormData({...formData, title: e.target.value})} required />
                        <textarea className="w-full border p-2 rounded mb-3 h-32" placeholder="Nội dung bài viết" onChange={e => setFormData({...formData, content: e.target.value})} required />
                    </>
                );
            default: return null;
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
        <div onClick={onClick} className={`bg-white p-6 rounded-xl shadow cursor-pointer hover:shadow-lg border-l-4 ${color} flex items-center justify-between`}>
            <div><p className="text-gray-500 font-bold uppercase text-xs">{label}</p><p className="text-3xl font-bold text-gray-800">{value}</p></div>
            <div className={`p-3 rounded-full opacity-20 ${color.replace('border-', 'bg-')}`}><Icon size={32} className={color.replace('border-', 'text-')} /></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* SIDEBAR */}
            <div className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-10">
                <div className="p-6 font-bold text-xl flex items-center gap-2 border-b border-gray-700"><LayoutDashboard className="text-blue-400" /> Admin CP</div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab("dashboard")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><LayoutDashboard size={20} /> Dashboard</button>
                    <button onClick={() => setActiveTab("users")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'users' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Users size={20} /> Người dùng</button>
                    <button onClick={() => setActiveTab("courses")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'courses' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><BookOpen size={20} /> Khóa học</button>
                    <button onClick={() => setActiveTab("flashcards")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'flashcards' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><Layers size={20} /> Flashcards</button>
                    <button onClick={() => setActiveTab("blogs")} className={`w-full flex items-center gap-3 px-4 py-3 rounded transition ${activeTab === 'blogs' ? 'bg-blue-600' : 'hover:bg-gray-800'}`}><PenTool size={20} /> Blogs</button>
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <button onClick={() => setCurrentPage('home')} className="w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 text-gray-400 mb-2"><ArrowLeft size={20} /> Về trang chủ</button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded bg-red-600 hover:bg-red-700 text-white font-bold"><LogOut size={20} /> Đăng xuất</button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 ml-64 p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 uppercase">Quản lý: {activeTab === 'dashboard' ? 'Tổng quan' : activeTab}</h1>
                    {activeTab !== 'dashboard' && (
                        <button onClick={handleOpenModal} className="bg-green-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2 hover:bg-green-700 shadow">
                            <Plus size={20} /> Thêm mới
                        </button>
                    )}
                </div>

                {activeTab === "dashboard" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard icon={Users} label="Người dùng" value={stats.users} color="border-blue-500" onClick={() => setActiveTab("users")} />
                        <StatCard icon={BookOpen} label="Khóa học" value={stats.courses} color="border-green-500" onClick={() => setActiveTab("courses")} />
                        <StatCard icon={Layers} label="Flashcards" value={stats.flashcards} color="border-purple-500" onClick={() => setActiveTab("flashcards")} />
                        <StatCard icon={PenTool} label="Bài viết" value={stats.blogs} color="border-orange-500" onClick={() => setActiveTab("blogs")} />
                    </div>
                ) : (
                    loading ? <p>Đang tải dữ liệu...</p> : (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-4 border-b font-bold text-gray-600">ID / Tên</th>
                                        <th className="p-4 border-b font-bold text-gray-600">Chi tiết</th>
                                        <th className="p-4 border-b font-bold text-gray-600 text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList.map((item) => (
                                        <tr key={item._id} className="hover:bg-gray-50 border-b">
                                            <td className="p-4">
                                                <div className="font-bold">{item.username || item.title || "No Name"}</div>
                                                <div className="text-xs text-gray-400">{item._id}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {activeTab === "users" && <span className={`px-2 py-1 rounded text-xs ${item.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{item.role}</span>}
                                                {activeTab === "courses" && <span>{item.price} VND - {item.level}</span>}
                                                {activeTab === "flashcards" && <span>{item.cards?.length || 0} thẻ</span>}
                                                {activeTab === "blogs" && <span>Tác giả: {item.author}</span>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDelete(item._id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {dataList.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-gray-400">Không có dữ liệu</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* MODAL THÊM MỚI */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg uppercase">Thêm {activeTab}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6">
                            {renderFormFields()}
                            <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 mt-4">Xác nhận thêm</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};