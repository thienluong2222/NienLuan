# --- FILE: backend/routes/exams.py ---
from flask import Blueprint, request, jsonify, current_app
from database import get_db
from bson.objectid import ObjectId
import datetime
import jwt

exams_bp = Blueprint('exams', __name__)
db = get_db()

# Helper: Lấy thông tin user từ Token
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

def is_admin(user_payload):
    if not user_payload: return False
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    return user and user.get('role') == 'admin'

def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

# --- ADMIN API ---

@exams_bp.route('', methods=['POST'])
def create_exam():
    user_payload = get_user_from_token()
    if not is_admin(user_payload): return jsonify({'message': 'Unauthorized'}), 403

    data = request.json
    # data['questions'] là list các object: { question: "", options: ["A", "B", "C", "D"], correct_index: 0 }
    if not data.get('title') or not data.get('questions'):
        return jsonify({'message': 'Thiếu tiêu đề hoặc câu hỏi'}), 400

    new_exam = {
        'title': data['title'],
        'description': data.get('description', ''),
        'duration': data.get('duration', 30), # Thời gian làm bài (phút)
        'questions': data['questions'],
        'created_at': datetime.datetime.now()
    }
    db.exams.insert_one(new_exam)
    return jsonify({'message': 'Tạo đề thi thành công'}), 201

@exams_bp.route('/<exam_id>', methods=['DELETE'])
def delete_exam(exam_id):
    user_payload = get_user_from_token()
    if not is_admin(user_payload): return jsonify({'message': 'Unauthorized'}), 403
    db.exams.delete_one({'_id': ObjectId(exam_id)})
    return jsonify({'message': 'Đã xóa đề thi'}), 200

# --- USER API ---

@exams_bp.route('', methods=['GET'])
def get_exams():
    # Lấy danh sách đề (ẩn đáp án để tiết kiệm băng thông và bảo mật sơ bộ)
    exams = list(db.exams.find({}, {'questions.correct_index': 0}))
    return jsonify([serialize_doc(e) for e in exams]), 200

@exams_bp.route('/<exam_id>', methods=['GET'])
def get_exam_detail(exam_id):
    # Lấy chi tiết đề để bắt đầu thi (Vẫn ẩn đáp án đúng, Client chỉ gửi lựa chọn lên)
    exam = db.exams.find_one({'_id': ObjectId(exam_id)}, {'questions.correct_index': 0})
    if not exam: return jsonify({'message': 'Đề thi không tồn tại'}), 404
    return jsonify(serialize_doc(exam)), 200

@exams_bp.route('/<exam_id>/submit', methods=['POST'])
def submit_exam(exam_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Chưa đăng nhập'}), 401

    data = request.json
    user_answers = data.get('answers', {}) # Dict: { "0": 1, "1": 3 } (Câu index 0 chọn đáp án index 1)
    duration_taken = data.get('duration_taken', 0) # Giây

    # Lấy đề gốc (có đáp án đúng) để chấm điểm
    exam = db.exams.find_one({'_id': ObjectId(exam_id)})
    if not exam: return jsonify({'message': 'Lỗi đề thi'}), 404

    score = 0
    total_questions = len(exam['questions'])
    
    # Chấm điểm
    for i, question in enumerate(exam['questions']):
        # user_answers key là string (do JSON), cần ép kiểu int nếu cần
        # đáp án client gửi lên là index của option (0, 1, 2, 3)
        user_choice = user_answers.get(str(i))
        if user_choice is not None and int(user_choice) == question['correct_index']:
            score += 1

    # Đếm số lần thi
    user_id = user_payload['user_id']
    attempt_count = db.results.count_documents({'user_id': user_id, 'exam_id': exam_id}) + 1

    # Lưu kết quả
    result_record = {
        'user_id': user_id,
        'exam_id': exam_id,
        'exam_title': exam['title'],
        'score': score,
        'total_questions': total_questions,
        'duration_taken': duration_taken,
        'attempt_number': attempt_count,
        'timestamp': datetime.datetime.now()
    }
    db.results.insert_one(result_record)

    return jsonify({
        'message': 'Nộp bài thành công',
        'score': score,
        'total': total_questions,
        'attempt': attempt_count
    }), 200

@exams_bp.route('/history', methods=['GET'])
def get_history():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Chưa đăng nhập'}), 401
    
    results = list(db.results.find({'user_id': user_payload['user_id']}).sort('timestamp', -1))
    return jsonify([serialize_doc(r) for r in results]), 200