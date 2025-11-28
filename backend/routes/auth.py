# --- FILE: auth.py ---
from flask import Blueprint, request, jsonify, current_app
from database import get_db
import datetime
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

auth_bp = Blueprint('auth', __name__)
db = get_db()

def serialize_course(course):
    if course:
        course['_id'] = str(course['_id'])
    return course

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Thiếu tên đăng nhập hoặc mật khẩu'}), 400

    if db.users.find_one({'username': username}):
        return jsonify({'message': 'Tên đăng nhập đã tồn tại'}), 400
    
    hashed_password = generate_password_hash(password)

    new_user = {
        'username': username,
        'password': hashed_password,
        'role': 'user',
        'created_at': datetime.datetime.now(),
        'enrolled_courses': []
    }
    db.users.insert_one(new_user)
    return jsonify({'message': 'Đăng ký thành công'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = db.users.find_one({'username': username})
    
    if not user:
        return jsonify({'message': 'Sai tài khoản hoặc mật khẩu'}), 401

    stored_password = user['password']
    is_valid = False
    needs_rehash = False

    try:
        if check_password_hash(stored_password, password):
            is_valid = True
    except:
        is_valid = False

    if not is_valid:
        if stored_password == password:
            is_valid = True
            needs_rehash = True 
    
    if is_valid:
        if needs_rehash:
            new_hash = generate_password_hash(password)
            db.users.update_one({'_id': user['_id']}, {'$set': {'password': new_hash}})

        token_payload = {
            'user_id': str(user['_id']),
            'username': user['username'], # [FIX] Thêm username vào Token
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }
        token = jwt.encode(token_payload, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({
            'message': 'Đăng nhập thành công',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'role': user['role']
            }
        }), 200
    
    return jsonify({'message': 'Sai tài khoản hoặc mật khẩu'}), 401

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]
    
    if not token:
        return jsonify({'message': 'Chưa đăng nhập'}), 401

    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        
        data = request.json
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'message': 'User không tồn tại'}), 404

        stored_password = user['password']
        is_old_pass_valid = False

        try:
            if check_password_hash(stored_password, old_password):
                is_old_pass_valid = True
        except:
            is_old_pass_valid = False
        
        if not is_old_pass_valid and stored_password == old_password:
             is_old_pass_valid = True

        if not is_old_pass_valid:
            return jsonify({'message': 'Mật khẩu cũ không đúng'}), 400

        new_hash = generate_password_hash(new_password)
        db.users.update_one({'_id': ObjectId(user_id)}, {'$set': {'password': new_hash}})
        
        return jsonify({'message': 'Đổi mật khẩu thành công'}), 200

    except Exception as e:
        return jsonify({'message': 'Lỗi xác thực', 'error': str(e)}), 401

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    token = None
    if 'Authorization' in request.headers:
        token = request.headers['Authorization'].split(" ")[1]

    if not token:
        return jsonify({'message': 'Thiếu token'}), 401

    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload['user_id']
        user = db.users.find_one({'_id': ObjectId(user_id)})
        
        if not user:
             return jsonify({'message': 'User không tồn tại'}), 401
        
        enrolled_ids = user.get('enrolled_courses', [])
        course_object_ids = [ObjectId(cid) for cid in enrolled_ids if ObjectId.is_valid(cid)]
        enrolled_courses_cursor = db.courses.find({'_id': {'$in': course_object_ids}})
        enrolled_details = [serialize_course(c) for c in enrolled_courses_cursor]

        return jsonify({
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'role': user['role'],
                'enrolled_courses_details': enrolled_details
            }
        }), 200

    except Exception as e:
        return jsonify({'message': 'Token không hợp lệ'}), 401