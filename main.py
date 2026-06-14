import os
import uuid
import functions_framework
from google.cloud import texttospeech
from google.cloud import storage
from flask import jsonify

# Khởi tạo sãn các client để tái sử dụng, giúp function chạy nhanh hơn
tts_client = texttospeech.TextToSpeechClient()
storage_client = storage.Client()

# TODO: Thay bằng tên Bucket bạn đã tạo ở bước thiết lập Cloud Storage
BUCKET_NAME = "tlu-faq-audio-bucket-2026" 

@functions_framework.http
def text_to_speech_api(request):
    # Lấy chính xác địa chỉ web đang gọi tới (cổng 3000 của bạn)
    origin = request.headers.get('Origin')

    # Khai báo header cho phép CORS và nhận Cookie
    headers = {
        'Access-Control-Allow-Origin': origin if origin else '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '3600'
    }

    # Xử lý request OPTIONS (Preflight của trình duyệt)
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        # Lấy text từ request của Frontend gửi lên
        request_json = request.get_json(silent=True)
        if not request_json or 'text' not in request_json:
            return (jsonify({"error": "Vui lòng cung cấp nội dung text"}), 400, headers)
            
        text = request_json['text']

        # BƯỚC 1: GỌI GOOGLE TTS API ĐỂ TẠO GIỌNG NÓI
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Cấu hình giọng tiếng Việt (vi-VN)
        voice = texttospeech.VoiceSelectionParams(
            language_code="vi-VN",
            name="vi-VN-Standard-A" # Giọng nữ tiêu chuẩn
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        response = tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # BƯỚC 2: LƯU FILE MP3 LÊN GOOGLE CLOUD STORAGE
        bucket = storage_client.bucket(BUCKET_NAME)
        # Tạo tên file ngẫu nhiên để không bị trùng (vd: faq_audio_abc123.mp3)
        filename = f"faq_audio_{uuid.uuid4().hex[:8]}.mp3"
        blob = bucket.blob(filename)

        # Upload file âm thanh (dưới dạng bytes)
        blob.upload_from_string(response.audio_content, content_type="audio/mpeg")

        # BƯỚC 3: TRẢ LINK VỀ CHO WEB
        # Đảm bảo bucket của bạn đã được cấu hình public access thì link này web mới hát được
        public_url = blob.public_url

        return (jsonify({"audio_url": public_url, "status": "success"}), 200, headers)

    except Exception as e:
        print(f"Lỗi hệ thống: {e}")
        return (jsonify({"error": str(e)}), 500, headers)