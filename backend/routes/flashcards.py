
from flask import Blueprint, jsonify, request
from database import get_db
from bson.objectid import ObjectId

flashcards_bp = Blueprint('flashcards', __name__)
db = get_db()

def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

@flashcards_bp.route('', methods=['GET'])
def get_flashcards():
    decks = list(db.flashcards.find())
    if not decks:
        sample_deck = {
            'title': '3000 Từ vựng cơ bản (Mẫu)',
            'cards': [{'front': 'Hello', 'back': 'Xin chào'}]
        }
        db.flashcards.insert_one(sample_deck)
        decks = [sample_deck]
    return jsonify([serialize_doc(d) for d in decks]), 200


@flashcards_bp.route('', methods=['POST'])
def create_deck():
    data = request.json
    if not data.get('title'):
        return jsonify({'message': 'Thiếu tiêu đề'}), 400
    
    # Mặc định tạo bộ thẻ rỗng hoặc nhận cards từ request
    new_deck = {
        'title': data['title'],
        'cards': data.get('cards', []) 
    }
    db.flashcards.insert_one(new_deck)
    return jsonify({'message': 'Tạo bộ thẻ thành công'}), 201

@flashcards_bp.route('/<deck_id>', methods=['DELETE'])
def delete_deck(deck_id):
    db.flashcards.delete_one({'_id': ObjectId(deck_id)})
    return jsonify({'message': 'Đã xóa bộ thẻ'}), 200