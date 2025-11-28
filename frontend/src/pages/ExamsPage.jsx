// --- FILE: frontend/src/pages/ExamsPage.jsx ---
import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, FileText, ChevronRight, ChevronLeft, Flag } from "lucide-react";
import { examService } from "../services/api";

export const ExamsPage = ({ user }) => {
    const [view, setView] = useState("list"); // list | taking | result
    const [exams, setExams] = useState([]);
    const [currentExam, setCurrentExam] = useState(null);
    const [examHistory, setExamHistory] = useState([]);
    
    // State cho quá trình thi
    const [answers, setAnswers] = useState({}); // { 0: 1, 1: 3 } (Câu 0 chọn B)
    const [currentPage, setCurrentPage] = useState(0); // Trang câu hỏi (mỗi trang 2 câu)
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [resultData, setResultData] = useState(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const data = await examService.getAll();
            setExams(data || []);
            if(user) {
                const history = await examService.getHistory();
                setExamHistory(history || []);
            }
        } catch (err) { alert(err.message); }
    };

    const startExam = async (examId) => {
        if (!user) return alert("Vui lòng đăng nhập để thi!");
        try {
            const detail = await examService.getDetail(examId);
            setCurrentExam(detail);
            setTimeRemaining(detail.duration * 60);
            setAnswers({});
            setCurrentPage(0);
            setView("taking");
        } catch (err) { alert(err.message); }
    };

    const submitExam = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;
        finishExam();
    };

    const finishExam = async () => {
        try {
            const durationTaken = (currentExam.duration * 60) - timeRemaining;
            const res = await examService.submit(currentExam._id, answers, durationTaken);
            setResultData(res);
            setView("result");
            fetchExams(); // Cập nhật lại lịch sử
        } catch (err) { alert(err.message); }
    };

    // Timer đếm ngược
    useEffect(() => {
        let timer;
        if (view === "taking" && timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        finishExam(); // Hết giờ tự nộp
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [view, timeRemaining]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- RENDER VIEWS ---

    if (view === "list") {
        return (
            <div className="container mx-auto p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 border-l-4 border-indigo-600 pl-4">Luyện đề trắc nghiệm</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Cột trái: Danh sách đề */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl text-gray-700">Đề thi mới nhất</h3>
                        {exams.length === 0 && <p>Chưa có đề thi nào.</p>}
                        {exams.map(exam => (
                            <div key={exam._id} className="bg-white p-6 rounded-xl shadow border hover:shadow-lg transition flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg text-indigo-700">{exam.title}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <Clock size={14} /> {exam.duration} phút • {exam.questions?.length} câu hỏi
                                    </p>
                                    <p className="text-sm text-gray-600 mt-2">{exam.description || "Không có mô tả"}</p>
                                </div>
                                <button 
                                    onClick={() => startExam(exam._id)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700"
                                >
                                    Làm bài
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Cột phải: Lịch sử thi */}
                    {user && (
                        <div className="bg-white p-6 rounded-xl shadow border h-fit">
                            <h3 className="font-bold text-xl text-gray-700 mb-4 flex items-center gap-2">
                                <FileText size={20} /> Lịch sử thi của bạn
                            </h3>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                {examHistory.length === 0 && <p className="text-gray-500">Bạn chưa làm đề nào.</p>}
                                {examHistory.map((h, idx) => (
                                    <div key={idx} className="border-b pb-2 last:border-0">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>{h.exam_title}</span>
                                            <span className={h.score/h.total_questions >= 0.5 ? "text-green-600" : "text-red-500"}>
                                                {h.score}/{h.total_questions}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Lần thi: {h.attempt_number}</span>
                                            <span>{new Date(h.timestamp).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === "taking" && currentExam) {
        // Logic phân trang: 2 câu mỗi trang
        const questionsPerPage = 2;
        const totalPages = Math.ceil(currentExam.questions.length / questionsPerPage);
        const currentQuestions = currentExam.questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);

        return (
            <div className="container mx-auto p-4 max-w-6xl">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* MAIN CONTENT: CÂU HỎI */}
                    <div className="flex-1">
                        <div className="bg-white p-4 rounded-xl shadow mb-4 flex justify-between items-center sticky top-20 z-10 border-b-4 border-indigo-500">
                            <h2 className="font-bold text-xl truncate">{currentExam.title}</h2>
                            <div className={`font-mono font-bold text-xl flex items-center gap-2 ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-700'}`}>
                                <Clock size={24} /> {formatTime(timeRemaining)}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {currentQuestions.map((q, idx) => {
                                const realIndex = currentPage * questionsPerPage + idx;
                                return (
                                    <div key={realIndex} className="bg-white p-6 rounded-xl shadow border" id={`q-${realIndex}`}>
                                        <h3 className="font-bold text-lg mb-4 flex gap-2">
                                            <span className="bg-indigo-100 text-indigo-800 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">
                                                {realIndex + 1}
                                            </span>
                                            {q.question}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((opt, optIdx) => (
                                                <div 
                                                    key={optIdx}
                                                    onClick={() => setAnswers({...answers, [realIndex]: optIdx})}
                                                    className={`p-3 border rounded-lg cursor-pointer transition flex items-center gap-3
                                                        ${answers[realIndex] === optIdx 
                                                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium ring-1 ring-indigo-500' 
                                                            : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center 
                                                        ${answers[realIndex] === optIdx ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}`}>
                                                        {answers[realIndex] === optIdx && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Pagination Buttons */}
                        <div className="flex justify-between mt-6">
                            <button 
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 flex items-center gap-2 hover:bg-gray-300"
                            >
                                <ChevronLeft size={20} /> Trước
                            </button>
                            
                            {currentPage < totalPages - 1 ? (
                                <button 
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded font-bold flex items-center gap-2 hover:bg-indigo-700"
                                >
                                    Tiếp theo <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button 
                                    onClick={submitExam}
                                    className="px-6 py-2 bg-green-600 text-white rounded font-bold flex items-center gap-2 hover:bg-green-700"
                                >
                                    Nộp bài <CheckCircle size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR: NAVIGATOR */}
                    <div className="w-full md:w-72 shrink-0">
                        <div className="bg-white p-4 rounded-xl shadow sticky top-20">
                            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Flag size={18} /> Danh sách câu hỏi
                            </h3>
                            <div className="grid grid-cols-5 gap-2">
                                {currentExam.questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentPage(Math.floor(idx / questionsPerPage))}
                                        className={`w-10 h-10 rounded text-sm font-bold transition
                                            ${answers[idx] !== undefined 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                                            ${Math.floor(idx / questionsPerPage) === currentPage ? 'ring-2 ring-yellow-400' : ''}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                                <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-indigo-600 rounded"></div> Đã làm</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-100 rounded border"></div> Chưa làm</div>
                            </div>
                            <button onClick={submitExam} className="w-full mt-6 bg-red-100 text-red-600 py-2 rounded font-bold hover:bg-red-200">
                                Nộp bài sớm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (view === "result" && resultData) {
        return (
            <div className="container mx-auto p-6 max-w-2xl text-center">
                <div className="bg-white p-10 rounded-2xl shadow-xl animate-in fade-in zoom-in duration-300">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                        <CheckCircle size={60} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Hoàn thành bài thi!</h2>
                    <p className="text-gray-500 mb-8">Bạn đã nộp bài thành công cho đề <b>{currentExam?.title}</b></p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <p className="text-xs text-indigo-500 font-bold uppercase">Điểm số</p>
                            <p className="text-3xl font-bold text-indigo-700">{resultData.score}/{resultData.total}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-xl">
                            <p className="text-xs text-orange-500 font-bold uppercase">Lần thi</p>
                            <p className="text-3xl font-bold text-orange-700">{resultData.attempt}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl">
                            <p className="text-xs text-blue-500 font-bold uppercase">Kết quả</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {Math.round((resultData.score/resultData.total)*100)}%
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setView("list"); setResultData(null); }}
                        className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-900 transition"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return null;
};