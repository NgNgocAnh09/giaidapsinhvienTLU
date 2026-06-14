# 1. Khởi tạo từ image Python cơ bản (nên dùng bản slim để nhẹ gọn)
FROM python:3.12-slim

# 2. Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file requirements.txt từ máy tính vào container
COPY requirements.txt .

# 4. Chạy lệnh pip install để cài đặt các thư viện
# Thêm cờ --no-cache-dir để Docker không lưu lại cache tải về, giúp giảm dung lượng image
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy toàn bộ mã nguồn còn lại (như file main.py) vào container
COPY . .

ENV GOOGLE_APPLICATION_CREDENTIALS="/app/key.json"

# 6. Lệnh để chạy ứng dụng (Ví dụ dưới đây là chạy Functions Framework)
CMD ["functions-framework", "--target=text_to_speech_api", "--port=8080"]