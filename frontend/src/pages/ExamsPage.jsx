// --- FILE: frontend/src/pages/ExamsPage.jsx ---
import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, FileText, Lock } from "lucide-react";
import { examService } from "../services/api";

export const ExamsPage = ({ user }) => {
    const [view, setView] = useState("list"); // list | taking | result
    const [exams, setExams] = useState([]);
    const [currentExam, setCurrentExam] = useState(null);
    const [examHistory, setExamHistory] = useState([]);
    
    // State thi
    const [answers, setAnswers] = useState({});
    const [currentPage, setCurrentPage] = useState(0);
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

    const handleStartExamClick = async (exam) => {
        if (!user) return alert("Vui lòng đăng nhập để thi!");
        
        let password = "";
        if (exam.has_password) {
            password = prompt("Đề thi này có mật khẩu. Vui lòng nhập:");
            if (password === null) return; // Người dùng ấn Cancel
        }

        try {
            // Gọi API start để lấy nội dung đề (nếu pass đúng)
            const detail = await examService.startExam(exam._id, password);
            setCurrentExam(detail);
            setTimeRemaining(detail.duration * 60);
            setAnswers({});
            setCurrentPage(0);
            setView("taking");
        } catch (err) {
            alert(err.message); // Thường là báo sai pass
        }
    };

    const finishExam = async () => {
        try {
            const durationTaken = (currentExam.duration * 60) - timeRemaining;
            const res = await examService.submit(currentExam._id, answers, durationTaken);
            setResultData(res);
            setView("result");
            fetchExams();
        } catch (err) { alert(err.message); }
    };

    // Timer Logic
    useEffect(() => {
        let timer;
        if (view === "taking" && timeRemaining > 0) {
            timer = setInterval(() => setTimeRemaining(prev => prev <= 1 ? (clearInterval(timer), finishExam(), 0) : prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [view, timeRemaining]);

    const formatTime = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

    // --- VIEW LIST ---
    if (view === "list") {
        return (
            <div className="container mx-auto p-6">
                <h2 className="text-3xl font-bold mb-6 text-gray-800 border-l-4 border-indigo-600 pl-4">Luyện đề trắc nghiệm</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* List đề thi */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl text-gray-700">Đề thi mới nhất</h3>
                        {exams.length === 0 && <p className="text-gray-500">Chưa có đề thi nào.</p>}
                        {exams.map(exam => (
                            <div key={exam._id} className="bg-white p-6 rounded-xl shadow border flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
                                        {exam.title} 
                                        {exam.has_password && <Lock size={14} className="text-orange-500"/>}
                                    </h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                        <Clock size={14} /> {exam.duration}p • Tạo bởi: {exam.creator_name}
                                    </p>
                                </div>
                                <button onClick={() => handleStartExamClick(exam)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">
                                    Làm bài
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Lịch sử thi */}
                    {user && (
                        <div className="bg-white p-6 rounded-xl shadow border h-fit">
                            <h3 className="font-bold text-xl text-gray-700 mb-4 flex items-center gap-2"><FileText size={20} /> Lịch sử thi của bạn</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {examHistory.length === 0 && <p className="text-gray-400 text-sm">Chưa có lịch sử.</p>}
                                {examHistory.map((h, idx) => (
                                    <div key={idx} className="border-b pb-2">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span>{h.exam_title}</span>
                                            <span className={h.score/h.total_questions >= 0.5 ? "text-green-600" : "text-red-500"}>{h.score}/{h.total_questions}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">{new Date(h.timestamp).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- VIEW TAKING ---
    if (view === "taking" && currentExam) {
        const questionsPerPage = 2;
        const currentQuestions = currentExam.questions.slice(currentPage * questionsPerPage, (currentPage + 1) * questionsPerPage);
        
        return (
            <div className="container mx-auto p-4 max-w-4xl">
                 <div className="bg-white p-4 rounded-xl shadow mb-4 flex justify-between items-center sticky top-20 z-10 border-b-4 border-indigo-500">
                    <h2 className="font-bold text-xl truncate">{currentExam.title}</h2>
                    <div className="font-mono font-bold text-xl flex items-center gap-2"><Clock size={24} /> {formatTime(timeRemaining)}</div>
                </div>
                <div className="space-y-6">
                    {currentQuestions.map((q, idx) => {
                        const realIndex = currentPage * questionsPerPage + idx;
                        return (
                            <div key={realIndex} className="bg-white p-6 rounded-xl shadow border">
                                <h3 className="font-bold text-lg mb-4 flex gap-2"><span className="bg-indigo-100 text-indigo-800 w-8 h-8 flex items-center justify-center rounded-full text-sm shrink-0">{realIndex + 1}</span>{q.question}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} onClick={() => setAnswers({...answers, [realIndex]: optIdx})} className={`p-3 border rounded-lg cursor-pointer flex items-center gap-3 ${answers[realIndex] === optIdx ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500' : 'hover:bg-gray-50'}`}>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${answers[realIndex] === optIdx ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}`}>{answers[realIndex] === optIdx && <div className="w-2 h-2 bg-white rounded-full" />}</div>{opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between mt-6">
                    <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Trước</button>
                    {currentPage < Math.ceil(currentExam.questions.length/questionsPerPage) - 1 ? 
                        <button onClick={() => setCurrentPage(prev => prev + 1)} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">Tiếp theo</button> :
                        <button onClick={() => {if(window.confirm("Nộp bài?")) finishExam()}} className="px-6 py-2 bg-green-600 text-white rounded font-bold">Nộp bài</button>
                    }
                </div>
            </div>
        );
    }

    // --- VIEW RESULT ---
    if (view === "result" && resultData) {
        return (
            <div className="container mx-auto p-6 max-w-2xl text-center">
                <div className="bg-white p-10 rounded-2xl shadow-xl">
                    <CheckCircle size={60} className="mx-auto text-green-600 mb-6" />
                    <h2 className="text-3xl font-bold mb-2">Hoàn thành!</h2>
                    <p className="text-3xl font-bold text-indigo-700 my-4">{resultData.score}/{resultData.total}</p>
                    <button onClick={() => { setView("list"); setResultData(null); }} className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold">Quay lại</button>
                </div>
            </div>
        );
    }
    return null;
};