from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import sys
import os
import uuid
import time

# ================================================================
# 1. CẤU HÌNH ENCODING CHO WINDOWS
# ================================================================
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# ================================================================
# 2. KHỞI TẠO FLASK APP & CORS
# ================================================================
app = Flask(__name__)
CORS(app) # Cho phép Frontend (cổng 5500 hoặc live server) gọi API thoải mái

# ================================================================
# 3. CẤU HÌNH GOOGLE CLOUD (Phần của Thành viên 3 - Tuấn Hiệp)
# ================================================================
# CHÚ Ý QUAN TRỌNG: Bạn PHẢI để file key.json nằm cùng thư mục với file server.py này
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./key.json"

try:
    from google.cloud import texttospeech
    from google.cloud import storage
    from google.cloud import firestore
    
    # Khởi tạo các client của Google Cloud
    tts_client = texttospeech.TextToSpeechClient()
    storage_client = storage.Client()
    db = firestore.Client(project="academichelp-b46a9")
    
    # Tên Bucket lưu file MP3 (Thay bằng tên thật của bạn nếu cần)
    BUCKET_NAME = "tlu-faq-audio-bucket-2026"
    print("✅ Đã kết nối thành công với Google Cloud (TTS, Storage, Firestore)!")
except Exception as e:
    print(f"⚠️ Chưa thể khởi tạo Google Cloud. Lỗi: {e}")
    print("Vui lòng kiểm tra lại file key.json và các thư viện (google-cloud-texttospeech, storage, firestore).")


# ================================================================
# 4. CẤU HÌNH THÔNG SỐ ZOHO DESK (Phần của Ngọc Ánh)
# ================================================================
ZOHO_CLIENT_ID = "1000.81OYNEW5BV0RX9GTG3L0J0L4SSVN0Y"
ZOHO_CLIENT_SECRET = "7032f02c6eb20a1af464a85138753ff1d004e6abf4"
ZOHO_REFRESH_TOKEN = "1000.6fd31e5ddcf1ae3e31ae8aa877702ec1.af121e0079ebfa655794739084e7af2f"
ZOHO_ORG_ID = "928553057"

DEPARTMENTS_POST_MAP = {
    "DEPT_01": "1397229000000418032",
    "DEPT_02": "1397229000000424619",
    "DEPT_03": "1397229000000429200"
}

DEPARTMENTS_GET_MAP = {
    "Phòng Đào tạo": "DEPT_01",
    "Phòng Công tác Sinh viên": "DEPT_02",
    "Phòng Tài chính Kế toán": "DEPT_03"
}

cached_access_token = None
token_expiry_time = 0

def get_access_token():
    """Tự động lấy Access Token mới từ Refresh Token (có cache)"""
    global cached_access_token, token_expiry_time
    
    if cached_access_token and time.time() < token_expiry_time - 60:
        return cached_access_token

    url = "https://accounts.zoho.com/oauth/v2/token"
    params = {
        "refresh_token": ZOHO_REFRESH_TOKEN,
        "client_id": ZOHO_CLIENT_ID,
        "client_secret": ZOHO_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    response = requests.post(url, params=params)
    data = response.json()
    
    access_token = data.get("access_token")
    expires_in = data.get("expires_in", 3600)
    
    if access_token:
        cached_access_token = access_token
        token_expiry_time = time.time() + expires_in
    
    return access_token

# ================================================================
# API 1: ZOHO GATEWAY
# ================================================================
@app.route('/zoho-gateway', methods=['GET', 'POST'])
def zoho_gateway():
    try:
        access_token = get_access_token()
        zoho_headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "orgId": ZOHO_ORG_ID,
            "Content-Type": "application/json;charset=UTF-8"
        }

        # --- LUỒNG GỬI YÊU CẦU MỚI (POST) ---
        if request.method == 'POST':
            req_data = request.get_json() or {}
            email = req_data.get('email')
            subject = req_data.get('subject')
            description = req_data.get('description')
            frontend_dept = req_data.get('department')
            
            real_dept_id = DEPARTMENTS_POST_MAP.get(frontend_dept)
            student_name = email.split('@')[0] if email else "Sinh Vien"
            zoho_payload = {
                "subject": subject,
                "description": description,
                "departmentId": real_dept_id,
                "contact": { "email": email,"lastName": student_name }
            }

            zoho_url = "https://desk.zoho.com/api/v1/tickets"
            res = requests.post(zoho_url, headers=zoho_headers, json=zoho_payload)
            return res.text, res.status_code

        # --- LUỒNG KÉO LỊCH SỬ VỀ (GET) ---
        elif request.method == 'GET':
            email = request.args.get('email')
            if not email:
                return jsonify({"error": "Missing email"}), 400

            zoho_url = f"https://desk.zoho.com/api/v1/tickets/search?email={email}"
            res = requests.get(zoho_url, headers=zoho_headers)

            if res.status_code == 200:
                res_data = res.json()
                zoho_tickets = []
                if isinstance(res_data, dict):
                    zoho_tickets = res_data.get('data', [])
                elif isinstance(res_data, list):
                    zoho_tickets = res_data

                optimized_list = []
                
                for t in zoho_tickets:
                    if not isinstance(t, dict):
                        continue
                    
                    dept_obj = t.get("department")
                    zoho_dept_name = dept_obj.get("name", "") if isinstance(dept_obj, dict) else ""
                    mapped_dept_code = DEPARTMENTS_GET_MAP.get(zoho_dept_name, "all")
                    
                    raw_date = t.get("createdTime", "")
                    formatted_date = "N/A"
                    if raw_date and "T" in raw_date:
                        try:
                            date_part = raw_date.split("T")[0]
                            parts = date_part.split("-")
                            if len(parts) == 3:
                                formatted_date = f"{parts[2]}/{parts[1]}/{parts[0]}"
                        except Exception:
                            pass

                    optimized_list.append({
                        "id": t.get("id"),
                        "subject": t.get("subject"),
                        "department": mapped_dept_code,
                        "status": t.get("status"), 
                        "date": formatted_date
                    })
                return jsonify(optimized_list), 200
            
            return res.text, res.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ================================================================
# API 2: AI GIỌNG NÓI (TEXT-TO-SPEECH)
# ================================================================
@app.route('/tts', methods=['POST'])
def tts_api():
    try:
        req_data = request.get_json() or {}
        text = req_data.get('text')
        
        if not text:
            return jsonify({"error": "Vui lòng cung cấp nội dung text"}), 400
            
        print(f"⏳ Đang tạo AI Giọng nói cho nội dung: {text[:30]}...")

        # 1. Gọi Google TTS API
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(language_code="vi-VN", name="vi-VN-Standard-A")
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

        response = tts_client.synthesize_speech(input=synthesis_input, voice=voice, audio_config=audio_config)

        # 2. Lưu file MP3 lên Google Cloud Storage
        bucket = storage_client.bucket(BUCKET_NAME)
        filename = f"faq_audio_{uuid.uuid4().hex[:8]}.mp3"
        blob = bucket.blob(filename)
        blob.upload_from_string(response.audio_content, content_type="audio/mpeg")

        print(f"✅ Đã tạo file MP3 và lưu tại Storage: {filename}")
        
        # 3. Trả link về cho Frontend
        return jsonify({"audio_url": blob.public_url, "status": "success"}), 200

    except Exception as e:
        print(f"❌ Lỗi Text-to-Speech: {e}")
        return jsonify({"error": str(e)}), 500


# ================================================================
# API 3: QUẢN LÝ BOOKMARK (FIRESTORE)
# ================================================================
@app.route('/bookmarks', methods=['POST'])
def manage_bookmarks_api():
    try:
        req_data = request.get_json() or {}
        email = req_data.get('email')
        action = req_data.get('action')  # 'get', 'add', 'remove'
        faq_id = req_data.get('faq_id')
        
        if not email:
            return jsonify({"error": "Thiếu email sinh viên"}), 400
            
        user_ref = db.collection("user_bookmarks").document(email)
        
        # HÀNH ĐỘNG 1: GET (Lấy danh sách bookmark)
        if action == 'get':
            doc_snap = user_ref.get()
            if doc_snap.exists:
                saved_faqs = doc_snap.to_dict().get('saved_faqs', [])
            else:
                user_ref.set({'saved_faqs': []})
                saved_faqs = []
            return jsonify({"saved_faqs": saved_faqs}), 200
            
        # HÀNH ĐỘNG 2: ADD (Thêm câu hỏi vào bookmark)
        elif action == 'add':
            if not faq_id:
                return jsonify({"error": "Thiếu faq_id"}), 400
            user_ref.set({"saved_faqs": firestore.ArrayUnion([faq_id])}, merge=True)
            return jsonify({"status": "success", "message": "Đã thêm bookmark"}), 200
            
        # HÀNH ĐỘNG 3: REMOVE (Xóa câu hỏi khỏi bookmark)
        elif action == 'remove':
            if not faq_id:
                return jsonify({"error": "Thiếu faq_id"}), 400
            user_ref.set({"saved_faqs": firestore.ArrayRemove([faq_id])}, merge=True)
            return jsonify({"status": "success", "message": "Đã xóa bookmark"}), 200
            
        else:
            return jsonify({"error": "Hành động không hợp lệ"}), 400

    except Exception as e:
        print(f"❌ Lỗi xử lý Bookmark: {e}")
        return jsonify({"error": str(e)}), 500


# ================================================================
# KHỞI CHẠY SERVER
# ================================================================
if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 SERVER BACKEND ĐANG CHẠY TẠI CÁC ĐỊA CHỈ:")
    print(" 1. Zoho API:  http://127.0.0.1:5000/zoho-gateway")
    print(" 2. Giọng nói: http://127.0.0.1:5000/tts")
    print(" 3. Bookmark:  http://127.0.0.1:5000/bookmarks")
    print("="*60 + "\n")
    
    app.run(debug=True, port=5000)