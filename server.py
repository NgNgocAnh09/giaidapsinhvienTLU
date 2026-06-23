from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import sys

# Thiet lap encoding UTF-8 cho console de tranh loi UnicodeEncodeError tren Windows
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

app = Flask(__name__)
# Kích hoạt CORS cho phép toàn bộ ứng dụng Frontend kết nối vào không bị chặn
CORS(app)

# ================================================================
# CẤU HÌNH THÔNG SỐ ZOHO DESK (Điền thông tin thật của Ngọc Ánh vào đây)
# ================================================================
ZOHO_CLIENT_ID = "1000.81OYNEW5BV0RX9GTG3L0J0L4SSVN0Y"
ZOHO_CLIENT_SECRET = "7032f02c6eb20a1af464a85138753ff1d004e6abf4"
ZOHO_REFRESH_TOKEN = "1000.6fd31e5ddcf1ae3e31ae8aa877702ec1.af121e0079ebfa655794739084e7af2f"
ZOHO_ORG_ID = "928553057"

# 1. BẢNG ÁNH XẠ XUÔI: Đổi mã Web thành ID thật trên Zoho Desk
DEPARTMENTS_POST_MAP = {
    "DEPT_01": "1397229000000418032",
    "DEPT_02": "1397229000000424619",
    "DEPT_03": "1397229000000429200"
}

# 2. BẢNG ÁNH XẠ NGƯỢC: Đổi tên phòng ban từ Zoho trả về thành mã Web để vẽ bộ lọc
DEPARTMENTS_GET_MAP = {
    "Phòng Đào tạo": "DEPT_01",
    "Phòng Công tác Sinh viên": "DEPT_02",
    "Phòng Tài chính Kế toán": "DEPT_03"
}

import time

# Bộ nhớ đệm Token để tránh gọi API Zoho Accounts liên tục
cached_access_token = None
token_expiry_time = 0

def get_access_token():
    """Tự động lấy Access Token mới từ Refresh Token (có cache)"""
    global cached_access_token, token_expiry_time
    
    # Nếu token vẫn còn hạn (trừ hao 60 giây an toàn), dùng lại token cũ
    if cached_access_token and time.time() < token_expiry_time - 60:
        print("⚡ [Token Cache]: Sử dụng Access Token còn hạn từ bộ nhớ đệm...")
        return cached_access_token

    url = "https://accounts.zoho.com/oauth/v2/token"
    params = {
        "refresh_token": ZOHO_REFRESH_TOKEN,
        "client_id": ZOHO_CLIENT_ID,
        "client_secret": ZOHO_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    print("⏳ [Bước 1]: Đang gọi sang Zoho Accounts để lấy Access Token mới...")
    response = requests.post(url, params=params)
    data = response.json()
    
    access_token = data.get("access_token")
    expires_in = data.get("expires_in", 3600)  # Mặc định Zoho trả về expires_in là 3600 giây
    
    if access_token:
        cached_access_token = access_token
        token_expiry_time = time.time() + expires_in
        print("✅ [Bước 2]: Đã nhận và lưu Access Token mới vào bộ nhớ đệm!")
    else:
        print("❌ [Lỗi]: Không thể lấy Access Token từ Zoho Accounts. Chi tiết:", data)
        
    return access_token

# Khai báo đường dẫn API Gateway local
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
            print(f"⏳ [Bước 3]: Đang đẩy dữ liệu đơn lên Zoho Desk (ID Phòng: {real_dept_id})...")
            res = requests.post(zoho_url, headers=zoho_headers, json=zoho_payload)
            print("\n🚨 [ZOHO POST RESPONSE]:", res.text)
            return res.text, res.status_code

        # --- LUỒNG KÉO LỊCH SỬ VỀ (GET) ---
        elif request.method == 'GET':
            email = request.args.get('email')
            if not email:
                return jsonify({"error": "Missing email"}), 400

            zoho_url = f"https://desk.zoho.com/api/v1/tickets/search?email={email}"
            res = requests.get(zoho_url, headers=zoho_headers)
            print("\n🚨 [ZOHO GET RESPONSE]:", res.text)


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
                        "status": t.get("status"), # Trả về chuẩn: Open, In Progress, Closed
                        "date": formatted_date
                    })
                return jsonify(optimized_list), 200
            
            return res.text, res.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy cục bộ tại cổng 5000 công khai
    print("🚀 Server Local đang chạy ổn định tại đường dẫn: http://127.0.0.1:5000/zoho-gateway")
    app.run(debug=True, port=5000)