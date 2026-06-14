// app.js
// 1. IMPORT FIREBASE SDK (Thay thế bằng config thực tế từ Google Cloud/Firebase Console của bạn)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHLjNHw0uzjd5cY5j9IbExUhsFDnLzn6c",
  authDomain: "tlu-helpdesk.firebaseapp.com",
  projectId: "tlu-helpdesk",
  storageBucket: "tlu-helpdesk.firebasestorage.app",
  messagingSenderId: "137075879936",
  appId: "1:137075879936:web:3963f4c12f821327e5a8e5",
  measurementId: "G-QD1KYPKY9M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 2. CÁC BIẾN DOM
const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// 3. XỬ LÝ ĐĂNG NHẬP
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validate đuôi email TLU
    if (!email.endsWith("@tlu.edu.vn")) {
        loginError.innerText = "Vui lòng sử dụng email sinh viên trường (@tlu.edu.vn)";
        return;
    }

    loginError.innerText = "Đang đăng nhập...";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Lưu email vào sessionStorage theo yêu cầu
            sessionStorage.setItem("tlu_userEmail", user.email);
            
            // Chuyển màn hình
            loginScreen.classList.remove('active');
            appShell.classList.add('active');
            loginError.innerText = "";
        })
        .catch((error) => {
            console.error(error.code);
            if(error.code === 'auth/invalid-credential') {
                loginError.innerText = "Sai tài khoản hoặc mật khẩu!";
            } else {
                loginError.innerText = "Lỗi hệ thống: " + error.message;
            }
        });
});

// 4. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP (Giữ phiên làm việc khi F5)
onAuthStateChanged(auth, (user) => {
    if (user) {
        sessionStorage.setItem("tlu_userEmail", user.email);
        loginScreen.classList.remove('active');
        appShell.classList.add('active');
    } else {
        sessionStorage.removeItem("tlu_userEmail");
        loginScreen.classList.add('active');
        appShell.classList.remove('active');
    }
});

// 5. ĐĂNG XUẤT
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Đã đăng xuất");
    }).catch((error) => {
        console.error(error);
    });
});

// 6. XỬ LÝ ĐỔI THEME (Global function)
window.changeTheme = function(themeName) {
    document.body.className = themeName;
    // Tùy chọn: Lưu theme vào localStorage để lần sau vào vẫn giữ nguyên màu
    localStorage.setItem('user_theme', themeName);
}

// Khôi phục theme nếu đã lưu trước đó
const savedTheme = localStorage.getItem('user_theme');
if(savedTheme) document.body.className = savedTheme;

// 7. XỬ LÝ THANH ĐIỀU HƯỚNG BÊN DƯỚI (App Shell Skeleton)
const navItems = document.querySelectorAll('.nav-item');
const mainContent = document.getElementById('main-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Xóa class active ở các nút khác
        navItems.forEach(nav => nav.classList.remove('active'));
        // Thêm class active vào nút được bấm
        item.classList.add('active');

        // Logic thay đổi nội dung main-content
        const target = item.getAttribute('data-target');
        if (target === 'home') {
            mainContent.innerHTML = '<h2>Bảng tin Thông báo & Tra cứu</h2><p>Vùng này dành cho chức năng Carousel Banner và Thanh tra cứu.</p>';
        } else if (target === 'saved') {
            mainContent.innerHTML = '<h2>Câu hỏi Đã lưu</h2><p>Danh sách ListView đọc từ localStorage sẽ hiển thị ở đây.</p>';
        } else if (target === 'history') {
            mainContent.innerHTML = '<h2>Lịch sử Yêu cầu (Tickets)</h2><p>Biểu đồ Chart.js và Danh sách Ticket từ Zoho Desk.</p>';
        }
    });
});