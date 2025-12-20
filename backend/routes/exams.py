# --- FILE: backend/routes/exams.py ---
from flask import Blueprint, request, jsonify, current_app
from database import get_db
from bson.objectid import ObjectId
import datetime
import jwt
import io
import json

# Thư viện cho AI & PDF
import google.generativeai as genai
from pypdf import PdfReader
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

exams_bp = Blueprint('exams', __name__)
db = get_db()

GEMINI_API_KEY = api_key
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash') 

def get_user_from_token():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]
    if not token: return None
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except:
        return None

def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

# --- CÁC API CŨ (Giữ nguyên) ---
@exams_bp.route('', methods=['GET'])
def get_exams():
    exams = list(db.exams.find())
    results = []
    for e in exams:
        results.append({
            '_id': str(e['_id']),
            'title': e['title'],
            'duration': e['duration'],
            'description': e.get('description', ''),
            'has_password': bool(e.get('password')),
            'creator_name': e.get('creator_name', 'Admin')
        })
    return jsonify(results), 200

@exams_bp.route('/<exam_id>/start', methods=['POST'])
def start_exam(exam_id):
    data = request.json or {}
    password_input = data.get('password', '')
    exam = db.exams.find_one({'_id': ObjectId(exam_id)})
    if not exam: return jsonify({'message': 'Đề thi không tồn tại'}), 404
    if exam.get('password') and str(exam.get('password')) != str(password_input):
        return jsonify({'message': 'Mật khẩu đề thi không đúng'}), 403
    return jsonify(serialize_doc(exam)), 200

@exams_bp.route('', methods=['POST'])
def create_exam():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    if user['role'] not in ['admin', 'teacher']: return jsonify({'message': 'Không có quyền tạo đề thi'}), 403
    data = request.json
    new_exam = {
        'title': data['title'],
        'description': data.get('description', ''),
        'duration': int(data['duration']),
        'questions': data['questions'],
        'password': data.get('password', ''),
        'creator_id': str(user['_id']),
        'creator_name': user['username']
    }
    db.exams.insert_one(new_exam)
    return jsonify({'message': 'Tạo đề thi thành công'}), 201

@exams_bp.route('/<exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    exam = db.exams.find_one({'_id': ObjectId(exam_id)})
    if user['role'] == 'admin' or str(exam.get('creator_id')) == str(user['_id']):
        db.exams.delete_one({'_id': ObjectId(exam_id)})
        return jsonify({'message': 'Đã xóa đề thi'}), 200
    return jsonify({'message': 'Không có quyền xóa'}), 403

@exams_bp.route('/<exam_id>/submit', methods=['POST'])
def submit_exam(exam_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    data = request.json
    user_answers = data.get('answers', {}) 
    duration_taken = data.get('duration_taken', 0)
    exam = db.exams.find_one({'_id': ObjectId(exam_id)})
    if not exam: return jsonify({'message': 'Lỗi đề thi'}), 404
    score = 0
    total_questions = len(exam['questions'])
    for i, question in enumerate(exam['questions']):
        user_choice = user_answers.get(str(i))
        if user_choice is not None and int(user_choice) == question['correct_index']:
            score += 1
    attempt_count = db.results.count_documents({'user_id': user_payload['user_id'], 'exam_id': exam_id}) + 1
    result_record = {
        'user_id': user_payload['user_id'],
        'username': user_payload.get('username'),
        'exam_id': exam_id,
        'exam_title': exam['title'],
        'creator_id': exam.get('creator_id'),
        'score': score,
        'total_questions': total_questions,
        'duration_taken': duration_taken,
        'attempt_number': attempt_count,
        'timestamp': datetime.datetime.now()
    }
    db.results.insert_one(result_record)
    return jsonify({'message': 'Nộp bài thành công', 'score': score, 'total': total_questions, 'attempt': attempt_count}), 200

@exams_bp.route('/history', methods=['GET'])
def get_history():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    results = list(db.results.find({'user_id': user_payload['user_id']}).sort('timestamp', -1))
    return jsonify([serialize_doc(r) for r in results]), 200

@exams_bp.route('/teacher-results', methods=['GET'])
def get_teacher_results():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    results = list(db.results.find({'creator_id': user_payload['user_id']}).sort('timestamp', -1))
    for r in results:
        r['_id'] = str(r['_id'])
        if isinstance(r.get('timestamp'), datetime.datetime):
            r['timestamp'] = r['timestamp'].isoformat()
    return jsonify(results), 200

# --- [NEW] API GEMINI GENERATE ---
@exams_bp.route('/generate-questions', methods=['POST'])
def generate_questions_from_pdf():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'message': 'Không có file PDF'}), 400
    
    file = request.files['file']
    if file.filename == '': return jsonify({'message': 'Chưa chọn file'}), 400

    try:
        reader = PdfReader(file)
        text_content = ""
        for page in reader.pages:
            text_content += page.extract_text() + "\n"
        
        # Giới hạn ký tự để tránh lỗi token limit
        text_content = text_content[:10000] 

        prompt = f"""
        Bạn là giáo viên đang soạn đề thi trắc nghiệm dựa trên tài liệu học tập được cung cấp.
        Dựa vào nội dung văn bản sau, hãy tạo ra đầy đủ câu hỏi trắc nghiệm tiếng Anh (hoặc tiếng Việt tùy nội dung).
        Chú ý mỗi câu hỏi chỉ có 1 đáp án, đáp án có thể được đặt ở cuối tài liệu, phương án được highlight trong tài liệu.
        Không tạo câu hỏi nếu không tìm thấy thông tin liên quan trong tài liệu.
        Tạo 5 câu hỏi mẫu.
        Không nhầm lẫn tạo câu hỏi từ tiêu đề của tài liệu, mục lục, hoặc các phần không liên quan.
        Yêu cầu định dạng trả về là một chuỗi JSON thuần túy (không bọc trong Markdown code block), là một danh sách các object có cấu trúc:
        [
            {{
                "question": "Nội dung câu hỏi?",
                "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
                "correct_index": 0 (số nguyên 0-3 tương ứng A-D)
            }}
        ]
        
        Nội dung văn bản:
        {text_content}
        """

        response = model.generate_content(prompt)
        raw_text = response.text

        clean_json_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        questions = json.loads(clean_json_text)

        return jsonify({'questions': questions}), 200

    except Exception as e:
        print("AI Error:", str(e))
        return jsonify({'message': 'Lỗi xử lý AI', 'error': str(e)}), 500