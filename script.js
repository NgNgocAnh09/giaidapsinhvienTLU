import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Dán Firebase Config của bạn vào đây
const firebaseConfig = {
    apiKey: "AIzaSyAPMC0P8vXHt4a1E1f6wx0URYB2wexHqcY",
    authDomain: "tlu-helpdesk-v2.firebaseapp.com",
    projectId: "tlu-helpdesk-v2",
    storageBucket: "tlu-helpdesk-v2.firebasestorage.app",
    messagingSenderId: "834033095788",
    appId: "1:834033095788:web:096ae7bbe727ce406cf449",
    measurementId: "G-4FEF7ZL2G1"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 1. LỆNH ĐẨY 5 MẪU DỮ LIỆU LÊN FIRESTORE
// ==========================================
async function seedFAQData() {
    // Mảng dữ liệu tuân thủ chuẩn JSON được nhóm thống nhất
    const faqData = [
        { faq_id: "faq_001", category: "hoc_phi", question: "Làm sao để nộp học phí qua ứng dụng ngân hàng?", answer: "Sinh viên chuyển khoản vào STK 123456 của nhà trường...", likes: 15, dislikes: 2 },
        { faq_id: "faq_002", category: "dao_tao", question: "Khi nào nhà trường mở đăng ký tín chỉ học kỳ 2?", answer: "Lịch đăng ký tín chỉ sẽ bắt đầu từ ngày 15/08. Sinh viên theo dõi trên trang daotao.tlu.edu.vn.", likes: 30, dislikes: 0 },
        { faq_id: "faq_003", category: "cntt", question: "Tôi bị quên mật khẩu email sinh viên (@tlu.edu.vn), phải làm sao?", answer: "Vui lòng mang thẻ sinh viên xuống phòng Máy tính tầng 1 nhà C1 để được cấp lại.", likes: 45, dislikes: 5 },
        { faq_id: "faq_004", category: "ctsv", question: "Thủ tục xin giấy xác nhận sinh viên để tạm hoãn nghĩa vụ quân sự?", answer: "Sinh viên in mẫu đơn trên website, điền thông tin và nộp tại phòng Công tác sinh viên (P.101 nhà hành chính).", likes: 80, dislikes: 1 },
        { faq_id: "faq_005", category: "hoc_phi", question: "Hạn cuối nộp học phí học kỳ này là bao giờ?", answer: "Hạn cuối để nộp học phí mà không bị hủy học phần là trước 17h00 ngày 30/09.", likes: 22, dislikes: 3 }
    ];

    try {
        const batch = writeBatch(db);
        
        faqData.forEach((faq) => {
            const docRef = doc(db, "faqs", faq.faq_id);
            batch.set(docRef, faq);
        });

        await batch.commit();
        console.log("Đã đẩy thành công 5 mẫu dữ liệu lên Firestore!");
        alert("Đẩy dữ liệu thành công! Hãy kiểm tra trên Firebase Console.");
    } catch (error) {
        console.error("Lỗi khi đẩy dữ liệu: ", error);
    }
}

// ==========================================
// 2. RENDER GIAO DIỆN (NÚT AUDIO & BOOKMARK)
// ==========================================
function renderSampleUI() {
    // Giả lập 1 document JSON kéo từ Firebase về
    const sampleData = {
        "faq_id": "faq_001",
        "category": "hoc_phi",
        "question": "Làm sao để nộp học phí qua ứng dụng ngân hàng?",
        "answer": "Sinh viên chuyển khoản vào STK 123456 của nhà trường...",
        "likes": 15,
        "dislikes": 2
    };

    const container = document.getElementById("faq-list");
    // Lưu ý: Mình đã thêm tham số thứ 2 vào hàm playAudio() để truyền nội dung câu trả lời lên cho AI đọc
    container.innerHTML = `
        <div class="faq-card">
            <span class="faq-category">${sampleData.category}</span>
            <h3>${sampleData.question}</h3>
            <p id="answer-${sampleData.faq_id}">${sampleData.answer}</p>
            <div class="faq-actions">
                <button class="btn-action" onclick="playAudio('${sampleData.faq_id}', '${sampleData.answer}')">🔊 Nghe AI đọc</button>
                <button class="btn-action" onclick="saveBookmark('${sampleData.faq_id}')">🔖 Lưu câu hỏi</button>
            </div>
        </div>
    `;
}

// ==========================================
// 3. XỬ LÝ SỰ KIỆN CLICK CHO MODULE JS
// ==========================================
// Hàm thêm từ khóa 'async' để có thể dùng 'await' khi gọi API
window.playAudio = async function(faqId, textToRead) {
    // Quan trọng: Thay đường link này bằng link Web Preview cổng 8080 trên Cloud Shell của bạn
    const apiUrl = "https://asia-southeast1-tribal-sunbeam-474413-q8.cloudfunctions.net/text_to_speech_api"; 
    
    alert("Đang gửi nội dung lên Cloud Function để tạo MP3...");

    try {
        // Gửi POST request chứa text lên Backend (Cloud Function)
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Đóng gói nội dung câu trả lời thành JSON
            credentials: 'include',
            body: JSON.stringify({ text: textToRead }) 
        });

        // Chờ Backend xử lý (gọi TTS API -> Lưu Storage -> Trả link về)
        const data = await response.json();
        
        if (data.audio_url) {
            console.log("Đã nhận link MP3 từ Google Cloud Storage:", data.audio_url);
            
            // Tạo đối tượng âm thanh và phát nhạc trực tiếp trên trình duyệt
            const audioPlayer = new Audio(data.audio_url);
            audioPlayer.play();
            
        } else {
            console.error("Lỗi từ server backend:", data);
            alert("Lỗi tạo âm thanh: " + data.error);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Không thể kết nối đến server backend. Hãy kiểm tra lại link apiUrl hoặc xem Backend Docker cổng 8080 đã chạy chưa.");
    }
};

window.saveBookmark = function(faqId) {
    alert("Đã thêm câu hỏi " + faqId + " vào Local Storage!");
    // Logic của tab Đã lưu
};

// Gọi hiển thị giao diện ngay khi load trang
renderSampleUI();

// Bạn có thể mở comment dòng dưới (hoặc gõ trong F12 Console) để test việc đẩy 5 mẫu dữ liệu
// seedFAQData();