# --- FILE: backend/routes/exams.py ---
from flask import Blueprint, request, jsonify, current_app
from database import get_db
from bson.objectid import ObjectId
import datetime
import jwt

exams_bp = Blueprint('exams', __name__)
db = get_db()

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

# [UPDATED] Lấy danh sách (Ẩn mật khẩu và câu hỏi)
@exams_bp.route('', methods=['GET'])
def get_exams():
    exams = list(db.exams.find())
    results = []
    for e in exams:
        # Không trả về câu hỏi và mật khẩu ở list view
        results.append({
            '_id': str(e['_id']),
            'title': e['title'],
            'duration': e['duration'],
            'description': e.get('description', ''),
            'has_password': bool(e.get('password')), # Cờ báo hiệu có pass
            'creator_name': e.get('creator_name', 'Admin')
        })
    return jsonify(results), 200

# [UPDATED] Lấy chi tiết đề thi (Kiểm tra pass nếu có)
@exams_bp.route('/<exam_id>/start', methods=['POST'])
def start_exam(exam_id):
    data = request.json or {}
    password_input = data.get('password', '')
    
    exam = db.exams.find_one({'_id': ObjectId(exam_id)})
    if not exam: return jsonify({'message': 'Đề thi không tồn tại'}), 404

    # Kiểm tra mật khẩu
    if exam.get('password'):
        if str(exam.get('password')) != str(password_input):
            return jsonify({'message': 'Mật khẩu đề thi không đúng'}), 403

    return jsonify(serialize_doc(exam)), 200

# [UPDATED] Tạo đề thi (Admin + Teacher)
@exams_bp.route('', methods=['POST'])
def create_exam():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    
    # Check quyền: Admin hoặc Teacher
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    if user['role'] not in ['admin', 'teacher']:
        return jsonify({'message': 'Không có quyền tạo đề thi'}), 403

    data = request.json
    new_exam = {
        'title': data['title'],
        'description': data.get('description', ''),
        'duration': int(data['duration']),
        'questions': data['questions'],
        'password': data.get('password', ''), # [MỚI] Lưu mật khẩu (rỗng nếu ko có)
        'creator_id': str(user['_id']),       # [MỚI] Lưu người tạo
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
    
    # Logic quyền xóa: Admin hoặc Chính chủ
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
        'username': user_payload.get('username'), # Lưu username để Teacher dễ xem
        'exam_id': exam_id,
        'exam_title': exam['title'],
        'creator_id': exam.get('creator_id'), # Lưu ID người tạo đề để dễ query
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
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    results = list(db.results.find({'user_id': user_payload['user_id']}).sort('timestamp', -1))
    return jsonify([serialize_doc(r) for r in results]), 200

# [NEW] API Cho Giáo viên xem kết quả của học viên (trên các đề do GV tạo)
@exams_bp.route('/teacher-results', methods=['GET'])
def get_teacher_results():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    
    # Lấy tất cả kết quả thi mà 'creator_id' của bài thi trùng với user_id hiện tại (Giáo viên)
    # Lưu ý: Lúc lưu result ta đã lưu creator_id vào result để query cho nhanh
    results = list(db.results.find({'creator_id': user_payload['user_id']}).sort('timestamp', -1))
    
    # Format lại ngày tháng
    for r in results:
        r['_id'] = str(r['_id'])
        if isinstance(r.get('timestamp'), datetime.datetime):
            r['timestamp'] = r['timestamp'].isoformat()
            
    return jsonify(results), 200