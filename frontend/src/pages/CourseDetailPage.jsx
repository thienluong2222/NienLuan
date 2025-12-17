// --- FILE: frontend/src/pages/CourseDetailPage.jsx ---
import React, { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Bell, Lock, Send, Download, File, UploadCloud } from "lucide-react";
import { courseService } from "../services/api";

export const CourseDetailPage = ({ user, courseId, onBack }) => {
    const [course, setCourse] = useState(null);
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");

    // State form
    const [msgContent, setMsgContent] = useState("");
    const [materialTitle, setMaterialTitle] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (courseId) fetchDetail();
    }, [courseId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const data = await courseService.getDetail(courseId);
            setCourse(data.course);
            setHasAccess(data.access);
        } catch (err) { alert(err.message); } 
        finally { setLoading(false); }
    };

    const isOwner = user && course && (user.role === 'admin' || user.id === course.instructor_id);

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        if(!msgContent.trim()) return;
        try {
            await courseService.addAnnouncement(courseId, msgContent);
            setMsgContent("");
            fetchDetail();
        } catch (err) { alert(err.message); }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        if (!selectedFile) return alert("Vui lòng chọn file!");
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("title", materialTitle);
            formData.append("file", selectedFile);
            await courseService.addMaterial(courseId, formData);
            setMaterialTitle("");
            setSelectedFile(null);
            document.getElementById("fileInput").value = ""; 
            alert("Upload thành công!");
            fetchDetail();
        } catch (err) { alert(err.message); } finally { setIsUploading(false); }
    };

    // Component hiển thị khi bị khóa
    const LockedContent = () => (
        <div className="bg-yellow-50 p-8 rounded-xl text-center border border-yellow-200 mt-4">
            <Lock size={48} className="mx-auto text-yellow-600 mb-4 opacity-50"/>
            <h3 className="text-xl font-bold text-yellow-800">Nội dung bị khóa</h3>
            <p className="text-yellow-700">Bạn cần đăng ký khóa học này để xem nội dung.</p>
        </div>
    );

    if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>;
    if (!course) return <div className="p-6">Khóa học không tồn tại.</div>;

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 font-bold">
                <ArrowLeft size={20} /> Quay lại danh sách
            </button>

            {/* HEADER */}
            <div className="bg-white p-8 rounded-2xl shadow-md border-b-4 border-blue-600 mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{course.title}</h1>
                <p className="text-gray-500 flex gap-4">
                    <span>GV: {course.instructor_name}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-bold">{course.level}</span>
                </p>
            </div>

            {/* TABS - Luôn hiển thị */}
            <div className="flex gap-4 border-b mb-6 overflow-x-auto">
                <button onClick={() => setActiveTab("info")} className={`pb-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Thông tin chung</button>
                <button onClick={() => setActiveTab("announcements")} className={`pb-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'announcements' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Bảng tin & Thông báo</button>
                <button onClick={() => setActiveTab("materials")} className={`pb-3 px-4 font-bold border-b-2 transition whitespace-nowrap ${activeTab === 'materials' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>Tài liệu học tập</button>
            </div>

            {/* CONTENT */}
            <div className="min-h-[300px]">
                {/* TAB INFO - Luôn hiển thị */}
                {activeTab === 'info' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h3 className="font-bold text-lg mb-4">Mô tả khóa học</h3>
                        <p className="text-gray-700 whitespace-pre-line">{course.description || "Chưa có mô tả."}</p>
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p><strong>Lịch học:</strong> {course.schedule}</p>
                            <p><strong>Giá:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}</p>
                        </div>
                    </div>
                )}

                {/* TAB ANNOUNCEMENTS - Check quyền */}
                {activeTab === 'announcements' && (
                    !hasAccess ? <LockedContent /> : (
                        <div>
                            {isOwner && (
                                <form onSubmit={handleAddAnnouncement} className="bg-white p-4 rounded-xl shadow-sm border mb-6">
                                    <textarea className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập thông báo mới..." rows="3" value={msgContent} onChange={e => setMsgContent(e.target.value)}></textarea>
                                    <div className="flex justify-end mt-2"><button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700"><Send size={16}/> Gửi</button></div>
                                </form>
                            )}
                            <div className="space-y-4">
                                {(!course.announcements || course.announcements.length === 0) && <p className="text-gray-500 text-center">Chưa có thông báo nào.</p>}
                                {course.announcements?.slice().reverse().map((msg, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500">
                                        <div className="flex justify-between items-center mb-2"><span className="font-bold text-blue-900 flex items-center gap-2"><Bell size={16}/> {msg.sender || "Giáo viên"}</span><span className="text-xs text-gray-400">{new Date(msg.date).toLocaleString()}</span></div>
                                        <p className="text-gray-700">{msg.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}

                {/* TAB MATERIALS - Check quyền */}
                {activeTab === 'materials' && (
                    !hasAccess ? <LockedContent /> : (
                        <div>
                            {isOwner && (
                                <form onSubmit={handleAddMaterial} className="bg-white p-6 rounded-xl shadow-sm border mb-6 grid gap-4">
                                    <h4 className="font-bold text-lg flex items-center gap-2"><UploadCloud size={20}/> Upload tài liệu mới</h4>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label><input className="w-full border p-2 rounded" placeholder="VD: Bài tập tuần 1..." value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} required/></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Chọn file</label><input id="fileInput" type="file" className="w-full border p-2 rounded bg-gray-50" onChange={e => setSelectedFile(e.target.files[0])} required /></div>
                                    <button disabled={isUploading} className="bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50">{isUploading ? <Loader2 className="animate-spin"/> : <UploadCloud size={18}/>} {isUploading ? "Đang upload..." : "Upload File"}</button>
                                </form>
                            )}
                            <div className="grid gap-3">
                                {(!course.materials || course.materials.length === 0) && <p className="text-gray-500 text-center">Chưa có tài liệu nào.</p>}
                                {course.materials?.map((mat, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between hover:bg-gray-50">
                                        <div className="flex items-center gap-3"><div className="p-3 bg-blue-100 rounded-lg text-blue-600"><File size={24}/></div><div><h4 className="font-bold text-gray-800">{mat.title}</h4><p className="text-xs text-gray-500">{mat.filename} • {new Date(mat.upload_date).toLocaleDateString()}</p></div></div>
                                        <a href={courseService.getDownloadLink(mat.file_id)} target="_blank" rel="noreferrer" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 hover:text-white transition flex items-center gap-2"><Download size={16}/> Tải về</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};