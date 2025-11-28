# --- FILE: backend/routes/courses.py ---
# (Giữ nguyên các import và phần cũ, thêm hàm delete)
from flask import Blueprint, request, jsonify
from database import get_db
from bson.objectid import ObjectId

courses_bp = Blueprint('courses', __name__)
db = get_db()

def serialize_doc(doc):
    if doc: doc['_id'] = str(doc['_id'])
    return doc

@courses_bp.route('', methods=['GET'])
def get_courses():
    courses = list(db.courses.find())
    return jsonify([serialize_doc(c) for c in courses]), 200

@courses_bp.route('', methods=['POST'])
def create_course():
    data = request.json
    new_course = {
        'title': data['title'],
        'description': data.get('description', ''),
        'price': data['price'],
        'schedule': data['schedule'],
        'level': data['level']
    }
    result = db.courses.insert_one(new_course)
    return jsonify({'message': 'Tạo khóa học thành công', 'id': str(result.inserted_id)}), 201

# [MỚI] API Xóa khóa học
@courses_bp.route('/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    # Trong thực tế nên check quyền admin ở đây
    db.courses.delete_one({'_id': ObjectId(course_id)})
    return jsonify({'message': 'Đã xóa khóa học'}), 200

@courses_bp.route('/enroll', methods=['POST'])
def enroll_course():
    data = request.json
    user_id = data.get('user_id')
    course_id = data.get('course_id')
    if not user_id or not course_id: return jsonify({'message': 'Thiếu thông tin'}), 400
    try:
        if not db.courses.find_one({'_id': ObjectId(course_id)}): return jsonify({'message': 'Khóa học không tồn tại'}), 404
        db.users.update_one({'_id': ObjectId(user_id)}, {'$addToSet': {'enrolled_courses': course_id}})
        return jsonify({'message': 'Đăng ký thành công'}), 200
    except Exception as e: return jsonify({'message': 'Lỗi', 'error': str(e)}), 400