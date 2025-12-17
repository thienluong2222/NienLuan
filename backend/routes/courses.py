# --- FILE: backend/routes/courses.py ---
from flask import Blueprint, request, jsonify, current_app, send_file
from database import get_db
from bson.objectid import ObjectId
import jwt
import datetime
import io 

courses_bp = Blueprint('courses', __name__)
db = get_db()

def serialize_doc(doc):
    if doc: doc['_id'] = str(doc['_id'])
    return doc

def get_user_from_token():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]
    elif request.args.get('token'): # Hỗ trợ token qua URL cho việc download file
        token = request.args.get('token')
        
    if not token: return None
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except:
        return None

# [PUBLIC] Lấy danh sách khóa học
@courses_bp.route('', methods=['GET'])
def get_courses():
    courses = list(db.courses.find({}, {'announcements': 0, 'materials': 0}))
    return jsonify([serialize_doc(c) for c in courses]), 200

# Lấy chi tiết khóa học
@courses_bp.route('/<course_id>', methods=['GET'])
def get_course_detail(course_id):
    user_payload = get_user_from_token()
    course = db.courses.find_one({'_id': ObjectId(course_id)})
    if not course: return jsonify({'message': 'Khóa học không tồn tại'}), 404

    is_authorized = False
    
    if user_payload:
        user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
        is_admin = user['role'] == 'admin'
        is_owner = str(course.get('instructor_id')) == str(user['_id'])
        is_enrolled = str(course['_id']) in user.get('enrolled_courses', [])
        
        if is_admin or is_owner or is_enrolled:
            is_authorized = True

    if not is_authorized:
        course.pop('announcements', None)
        course.pop('materials', None)
        return jsonify({'course': serialize_doc(course), 'access': False}), 200
    
    return jsonify({'course': serialize_doc(course), 'access': True}), 200

@courses_bp.route('/created', methods=['GET'])
def get_my_created_courses():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Chưa đăng nhập'}), 401
    courses = list(db.courses.find({'instructor_id': user_payload['user_id']}))
    return jsonify([serialize_doc(c) for c in courses]), 200

@courses_bp.route('', methods=['POST'])
def create_course():
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    if not user or user.get('role') not in ['admin', 'teacher']:
        return jsonify({'message': 'Chỉ Giáo viên hoặc Admin mới được tạo khóa học'}), 403

    data = request.json
    new_course = {
        'title': data['title'],
        'description': data.get('description', ''),
        'price': int(data['price']),
        'schedule': data['schedule'],
        'level': data['level'],
        'instructor_id': str(user['_id']),
        'instructor_name': user['username'],
        'announcements': [], 
        'materials': []      
    }
    result = db.courses.insert_one(new_course)
    return jsonify({'message': 'Tạo khóa học thành công', 'id': str(result.inserted_id)}), 201

@courses_bp.route('/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    user = db.users.find_one({'_id': ObjectId(user_payload['user_id'])})
    course = db.courses.find_one({'_id': ObjectId(course_id)})
    if not course: return jsonify({'message': 'Khóa học không tồn tại'}), 404
    is_admin = user.get('role') == 'admin'
    is_owner = str(course.get('instructor_id')) == str(user['_id'])
    if not (is_admin or is_owner):
        return jsonify({'message': 'Không có quyền xóa'}), 403
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

@courses_bp.route('/<course_id>/announcements', methods=['POST'])
def add_announcement(course_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.json
    announcement = {
        'id': str(ObjectId()),
        'content': data.get('content'),
        'date': datetime.datetime.now().isoformat(),
        'sender': user_payload.get('username')
    }
    db.courses.update_one({'_id': ObjectId(course_id)}, {'$push': {'announcements': announcement}})
    return jsonify({'message': 'Đã thêm thông báo'}), 200

# [UPDATED] Thêm Tài liệu (Upload File)
@courses_bp.route('/<course_id>/materials', methods=['POST'])
def add_material(course_id):
    user_payload = get_user_from_token()
    if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    
    # Kiểm tra có file không
    if 'file' not in request.files:
        return jsonify({'message': 'Không có file được gửi lên'}), 400
    
    file = request.files['file']
    title = request.form.get('title', file.filename)
    
    if file.filename == '':
        return jsonify({'message': 'Chưa chọn file'}), 400

    try:
        # Lưu nội dung file vào collection riêng để nhẹ bảng courses
        file_doc = {
            'filename': file.filename,
            'content_type': file.content_type,
            'data': file.read(), # Đọc binary
            'uploaded_at': datetime.datetime.now(),
            'uploader_id': user_payload['user_id']
        }
        # Insert vào collection 'course_files'
        insert_result = db.course_files.insert_one(file_doc)
        file_id = str(insert_result.inserted_id)

        # Lưu thông tin tham chiếu vào khóa học
        material = {
            'id': str(ObjectId()),
            'title': title,
            'type': 'file', # Đánh dấu là file
            'file_id': file_id,
            'filename': file.filename,
            'upload_date': datetime.datetime.now().isoformat()
        }
        
        db.courses.update_one({'_id': ObjectId(course_id)}, {'$push': {'materials': material}})
        return jsonify({'message': 'Đã upload tài liệu thành công'}), 200
    except Exception as e:
        return jsonify({'message': 'Lỗi upload', 'error': str(e)}), 500

# [NEW] Download tài liệu
@courses_bp.route('/materials/<file_id>/download', methods=['GET'])
def download_material(file_id):
    # Lấy token từ query param ?token=... vì thẻ <a> không gửi header Authorization
    # user_payload = get_user_from_token() 
    # if not user_payload: return jsonify({'message': 'Unauthorized'}), 401
    # Để đơn giản cho demo, tạm thời cho phép download nếu có link (hoặc bạn có thể bật check token ở trên)

    try:
        file_doc = db.course_files.find_one({'_id': ObjectId(file_id)})
        if not file_doc: return jsonify({'message': 'File không tồn tại'}), 404
        
        return send_file(
            io.BytesIO(file_doc['data']),
            mimetype=file_doc['content_type'],
            as_attachment=True,
            download_name=file_doc['filename']
        )
    except Exception as e:
        return jsonify({'message': 'Lỗi download', 'error': str(e)}), 500