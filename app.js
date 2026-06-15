// ================================================================
// CỔNG HỖ TRỢ HỌC VỤ TLU - MAIN APPLICATION
// TV1: Firebase Auth, Theme, Navigation
// TV2: Firestore, Banner, Search, FAQ, Modal, Rating
// ================================================================

// ========== 1. IMPORT FIREBASE SDK ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ========== 2. FIREBASE CONFIG ==========
const firebaseConfig = {
    apiKey: "AIzaSyAPMC0P8vXHt4a1E1f6wx0URYB2wexHqcY",
    authDomain: "tlu-helpdesk-v2.firebaseapp.com",
    projectId: "tlu-helpdesk-v2",
    storageBucket: "tlu-helpdesk-v2.firebasestorage.app",
    messagingSenderId: "834033095788",
    appId: "1:834033095788:web:096ae7bbe727ce406cf449",
    measurementId: "G-4FEF7ZL2G1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================================================================
// TV2: DỮ LIỆU MẪU (FALLBACK KHI FIRESTORE CHƯA SẴN SÀNG)
// ================================================================
const SAMPLE_BANNERS = [
    {
        id: "banner_001",
        icon: "🚨",
        title: "Hạn đóng học phí HK2 năm học 2025-2026",
        subtitle: "Hạn cuối: 30/06/2026 — Vui lòng hoàn thành trước thời hạn",
        gradient: "linear-gradient(135deg, #ff416c, #ff4b2b)",
        urgent: true
    },
    {
        id: "banner_002",
        icon: "📅",
        title: "Đăng ký học phần HK1 năm 2026-2027",
        subtitle: "Thời gian đăng ký: 01/07 — 15/07/2026",
        gradient: "linear-gradient(135deg, #667eea, #764ba2)"
    },
    {
        id: "banner_003",
        icon: "🎓",
        title: "Thông báo xét tốt nghiệp đợt tháng 9/2026",
        subtitle: "Nộp hồ sơ từ 01/08 — 15/08/2026 tại Phòng Đào tạo",
        gradient: "linear-gradient(135deg, #11998e, #38ef7d)"
    },
    {
        id: "banner_004",
        icon: "🏅",
        title: "Chương trình Học bổng Tài năng TLU 2026",
        subtitle: "Đang mở đơn đăng ký — Hạn nộp: 20/07/2026",
        gradient: "linear-gradient(135deg, #f093fb, #f5576c)"
    }
];

const SAMPLE_FAQS = [
    {
        faq_id: "faq_001",
        category: "hoc_phi",
        question: "Làm sao để nộp học phí qua ứng dụng ngân hàng?",
        answer: "Sinh viên thực hiện chuyển khoản vào tài khoản của nhà trường theo hướng dẫn sau:\n\n1. Mở ứng dụng ngân hàng (Vietcombank, BIDV, Agribank, ...)\n2. Chọn mục \"Chuyển khoản\"\n3. Nhập số tài khoản: 1234567890 — Ngân hàng Vietcombank\n4. Nội dung chuyển khoản: [Mã SV] - [Họ tên] - Nộp học phí HK2\n5. Kiểm tra lại thông tin và xác nhận\n\nLưu ý: Giữ lại biên lai giao dịch để đối chiếu khi cần thiết. Học phí sẽ được cập nhật trong vòng 3-5 ngày làm việc.",
        likes: 45,
        dislikes: 3
    },
    {
        faq_id: "faq_002",
        category: "hoc_phi",
        question: "Hạn cuối đóng học phí học kỳ 2 là khi nào?",
        answer: "Hạn cuối đóng học phí Học kỳ 2 năm học 2025-2026 là ngày 30/06/2026.\n\nSinh viên chưa hoàn thành nghĩa vụ học phí sẽ:\n• Không được xem điểm thi\n• Không được đăng ký học phần kỳ tiếp theo\n• Bị tạm khóa tài khoản sinh viên\n\nTrường hợp khó khăn tài chính, liên hệ Phòng Tài chính Kế toán để được hỗ trợ phương án đóng học phí theo đợt.",
        likes: 32,
        dislikes: 1
    },
    {
        faq_id: "faq_003",
        category: "hoc_phi",
        question: "Sinh viên được miễn giảm học phí trong trường hợp nào?",
        answer: "Các đối tượng được miễn giảm học phí theo quy định:\n\n🔹 Miễn 100%:\n• Con liệt sĩ, con thương binh nặng\n• Sinh viên mồ côi cả cha lẫn mẹ\n• Sinh viên khuyết tật nặng\n\n🔹 Giảm 70%:\n• Sinh viên dân tộc thiểu số thuộc hộ nghèo\n\n🔹 Giảm 50%:\n• Sinh viên thuộc hộ nghèo theo chuẩn quốc gia\n\nHồ sơ nộp tại Phòng Công tác Sinh viên trước ngày 15 của tháng đầu mỗi học kỳ.",
        likes: 28,
        dislikes: 0
    },
    {
        faq_id: "faq_004",
        category: "dang_ky",
        question: "Cách đăng ký học phần trên hệ thống?",
        answer: "Quy trình đăng ký học phần online:\n\n1. Truy cập hệ thống: https://qldt.tlu.edu.vn\n2. Đăng nhập bằng tài khoản sinh viên\n3. Vào mục \"Đăng ký học phần\"\n4. Chọn các môn học theo kế hoạch đào tạo\n5. Chọn lớp và ca học phù hợp\n6. Nhấn \"Xác nhận đăng ký\"\n\n⚠️ Lưu ý quan trọng:\n• Kiểm tra điều kiện tiên quyết trước khi đăng ký\n• Số tín chỉ tối thiểu: 14 TC/kỳ, tối đa: 25 TC/kỳ\n• Nên đăng ký sớm để có nhiều lựa chọn lớp học",
        likes: 55,
        dislikes: 2
    },
    {
        faq_id: "faq_005",
        category: "dang_ky",
        question: "Làm sao để hủy đăng ký học phần đã đăng ký?",
        answer: "Hướng dẫn hủy học phần:\n\n1. Đăng nhập hệ thống QLDT\n2. Vào \"Đăng ký học phần\" → \"Kết quả đăng ký\"\n3. Tìm môn cần hủy và nhấn \"Hủy đăng ký\"\n4. Xác nhận hủy\n\n⏰ Thời hạn hủy: Trong 2 tuần đầu của học kỳ (không mất phí)\nSau 2 tuần: Được rút học phần nhưng vẫn phải đóng 50% học phí môn đó.\n\nSinh viên cần cân nhắc kỹ trước khi hủy để đảm bảo đủ số tín chỉ tối thiểu trong kỳ.",
        likes: 20,
        dislikes: 1
    },
    {
        faq_id: "faq_006",
        category: "tot_nghiep",
        question: "Điều kiện để được xét tốt nghiệp là gì?",
        answer: "Điều kiện xét tốt nghiệp tại Đại học Thủy Lợi:\n\n✅ Tích lũy đủ số tín chỉ theo chương trình đào tạo\n✅ Điểm trung bình tích lũy (CPA) ≥ 2.0/4.0\n✅ Không đang trong thời gian bị truy cứu trách nhiệm hình sự\n✅ Hoàn thành nghĩa vụ học phí\n✅ Đạt chuẩn đầu ra Tiếng Anh (TOEIC ≥ 450 hoặc tương đương)\n✅ Đạt chuẩn đầu ra Tin học (chứng chỉ IC3/MOS hoặc tương đương)\n✅ Hoàn thành Giáo dục Quốc phòng – An ninh\n✅ Đã bảo vệ Đồ án / Khóa luận tốt nghiệp đạt yêu cầu",
        likes: 67,
        dislikes: 4
    },
    {
        faq_id: "faq_007",
        category: "tot_nghiep",
        question: "Quy trình nộp hồ sơ xét tốt nghiệp?",
        answer: "Quy trình nộp hồ sơ xét tốt nghiệp:\n\nBước 1: Kiểm tra điều kiện tốt nghiệp trên hệ thống QLDT\nBước 2: Chuẩn bị hồ sơ gồm:\n   • Đơn xin xét tốt nghiệp (theo mẫu)\n   • Bản sao chứng chỉ Tiếng Anh\n   • Bản sao chứng chỉ Tin học\n   • Chứng nhận hoàn thành GDQP-AN\n   • 4 ảnh 3x4 (nền xanh)\nBước 3: Nộp hồ sơ tại Phòng Đào tạo\nBước 4: Theo dõi kết quả trên website trường\n\nThời gian xét: 30 ngày làm việc kể từ ngày kết thúc nhận hồ sơ.",
        likes: 38,
        dislikes: 2
    },
    {
        faq_id: "faq_008",
        category: "hoc_bong",
        question: "Các loại học bổng hiện có tại TLU?",
        answer: "Đại học Thủy Lợi hiện có các loại học bổng:\n\n🏆 Học bổng Khuyến khích Học tập:\n• Loại Xuất sắc: 100% học phí\n• Loại Giỏi: 50% học phí\n• Loại Khá: 30% học phí\n\n🌟 Học bổng Tài năng TLU:\n• Dành cho sinh viên có thành tích nghiên cứu khoa học, thi đấu thể thao quốc gia\n\n🤝 Học bổng Doanh nghiệp:\n• Học bổng Samsung, Vietcombank, EVN (theo từng đợt)\n\n💚 Học bổng Hỗ trợ:\n• Dành cho sinh viên có hoàn cảnh khó khăn vượt khó\n\nThông tin chi tiết xem tại: Phòng Công tác Sinh viên",
        likes: 51,
        dislikes: 1
    },
    {
        faq_id: "faq_009",
        category: "hoc_bong",
        question: "Điều kiện để được xét học bổng khuyến khích học tập?",
        answer: "Điều kiện xét Học bổng Khuyến khích Học tập:\n\n📌 Điều kiện chung:\n• Không vi phạm kỷ luật trong học kỳ xét\n• Không có môn điểm F hoặc bị cấm thi\n• Đăng ký tối thiểu 14 tín chỉ trong kỳ\n\n📌 Xếp loại cụ thể:\n• Xuất sắc: GPA ≥ 3.6 và Rèn luyện Xuất sắc\n• Giỏi: GPA ≥ 3.2 và Rèn luyện Tốt trở lên\n• Khá: GPA ≥ 2.8 và Rèn luyện Khá trở lên\n\nHọc bổng được xét tự động sau mỗi học kỳ, sinh viên không cần nộp đơn.",
        likes: 42,
        dislikes: 0
    },
    {
        faq_id: "faq_010",
        category: "ktx",
        question: "Cách đăng ký ở ký túc xá?",
        answer: "Hướng dẫn đăng ký ở Ký túc xá TLU:\n\n1. Truy cập website KTX: https://ktx.tlu.edu.vn\n2. Điền đơn đăng ký online\n3. Chọn loại phòng:\n   • Phòng 6 người: 200.000đ/tháng\n   • Phòng 4 người: 350.000đ/tháng\n   • Phòng 2 người (có điều hòa): 600.000đ/tháng\n4. Nộp hồ sơ gốc tại Ban Quản lý KTX\n5. Đóng phí và nhận phòng\n\n📋 Hồ sơ cần thiết:\n• Đơn đăng ký (theo mẫu)\n• Bản sao CMND/CCCD\n• Giấy xác nhận sinh viên\n• 2 ảnh 3x4\n\nƯu tiên: Sinh viên năm nhất, sinh viên ngoại tỉnh, sinh viên có hoàn cảnh khó khăn.",
        likes: 33,
        dislikes: 2
    },
    {
        faq_id: "faq_011",
        category: "ktx",
        question: "Nội quy và quy định ở KTX?",
        answer: "Nội quy Ký túc xá Đại học Thủy Lợi:\n\n🕐 Giờ giấc:\n• Đóng cổng: 23:00 hàng ngày\n• Mở cổng: 05:00 sáng\n• Giờ yên tĩnh: 22:00 — 06:00\n\n🚫 Nghiêm cấm:\n• Sử dụng chất kích thích, rượu bia trong KTX\n• Nấu ăn trong phòng ở\n• Chứa chấp người lạ qua đêm\n• Sử dụng thiết bị điện công suất lớn\n\n✅ Quy định:\n• Giữ vệ sinh phòng ở và khu vực chung\n• Đóng tiền phòng đúng hạn (trước ngày 10 hàng tháng)\n• Báo cáo Ban Quản lý khi có sự cố\n• Tham gia các buổi kiểm tra phòng ở định kỳ",
        likes: 18,
        dislikes: 3
    }
];

// Tên danh mục để hiển thị
const CATEGORY_NAMES = {
    "all": "Tất cả",
    "hoc_phi": "Học phí",
    "dang_ky": "Đăng ký",
    "tot_nghiep": "Tốt nghiệp",
    "hoc_bong": "Học bổng",
    "ktx": "KTX"
};

// ================================================================
// TRẠNG THÁI ỨNG DỤNG (TV2)
// ================================================================
let allFAQs = [];
let allBanners = [];
let currentCategory = 'all';
let currentSearchQuery = '';
let currentModalFaq = null;
let bannerInterval = null;
let currentBannerIndex = 0;
let homeInitialized = false;

// ================================================================
// 3. CÁC BIẾN DOM (TV1)
// ================================================================
const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const mainContent = document.getElementById('main-app-content');

// ================================================================
// 4. XỬ LÝ ĐĂNG NHẬP (TV1)
// ================================================================
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

            // TV2: Khởi tạo trang chủ sau đăng nhập
            initHomeTab();
        })
        .catch((error) => {
            console.error(error.code);
            if (error.code === 'auth/invalid-credential') {
                loginError.innerText = "Sai tài khoản hoặc mật khẩu!";
            } else {
                loginError.innerText = "Lỗi hệ thống: " + error.message;
            }
        });
});

// ================================================================
// 5. KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP (TV1 + TV2)
// ================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        sessionStorage.setItem("tlu_userEmail", user.email);
        loginScreen.classList.remove('active');
        appShell.classList.add('active');
        // TV2: Khởi tạo trang chủ khi khôi phục phiên
        initHomeTab();
    } else {
        sessionStorage.removeItem("tlu_userEmail");
        loginScreen.classList.add('active');
        appShell.classList.remove('active');
        stopBannerAutoPlay();
    }
});

// ================================================================
// 6. ĐĂNG XUẤT (TV1)
// ================================================================
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Đã đăng xuất");
        stopBannerAutoPlay();
        homeInitialized = false;
    }).catch((error) => {
        console.error(error);
    });
});

// ================================================================
// 7. ĐỔI THEME (TV1)
// ================================================================
window.changeTheme = function (themeName) {
    document.body.className = themeName;
    localStorage.setItem('user_theme', themeName);
}

// Khôi phục theme
const savedTheme = localStorage.getItem('user_theme');
if (savedTheme) document.body.className = savedTheme;

// ================================================================
// TV2: HÀM LẤY EMAIL NGƯỜI DÙNG (Dùng cho TV4, TV5)
// ================================================================
window.getCurrentUserEmail = function () {
    return sessionStorage.getItem("tlu_userEmail");
}

// ================================================================
// TV2: LOAD DỮ LIỆU TỪ FIRESTORE
// ================================================================
async function loadFAQsFromFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "faqs"));
        if (querySnapshot.empty) {
            console.warn("⚠️ Firestore FAQs trống → dùng dữ liệu mẫu");
            return [...SAMPLE_FAQS];
        }
        const faqs = [];
        querySnapshot.forEach((docSnap) => {
            faqs.push({ ...docSnap.data(), _docId: docSnap.id });
        });
        console.log(`✅ Đã tải ${faqs.length} FAQ từ Firestore`);
        return faqs;
    } catch (error) {
        console.warn("⚠️ Lỗi Firestore, dùng dữ liệu mẫu:", error.message);
        return [...SAMPLE_FAQS];
    }
}

async function loadBannersFromFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        if (querySnapshot.empty) {
            return [...SAMPLE_BANNERS];
        }
        const banners = [];
        querySnapshot.forEach((docSnap) => {
            banners.push(docSnap.data());
        });
        console.log(`✅ Đã tải ${banners.length} banner từ Firestore`);
        return banners;
    } catch (error) {
        console.warn("⚠️ Lỗi load banners:", error.message);
        return [...SAMPLE_BANNERS];
    }
}

// ================================================================
// TV2: KHỞI TẠO TAB TRANG CHỦ
// ================================================================
async function initHomeTab() {
    if (homeInitialized) {
        renderHomeTab();
        return;
    }

    // Hiển thị loading
    mainContent.innerHTML = `
        <div class="faq-loading">
            <div class="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
        </div>
    `;

    // Load dữ liệu song song
    const [banners, faqs] = await Promise.all([
        loadBannersFromFirestore(),
        loadFAQsFromFirestore()
    ]);

    allBanners = banners;
    allFAQs = faqs;
    homeInitialized = true;

    renderHomeTab();
}

// ================================================================
// TV2: RENDER TRANG CHỦ
// ================================================================
function renderHomeTab() {
    stopBannerAutoPlay();

    mainContent.innerHTML = `
        <!-- Banner Carousel -->
        <div class="banner-carousel" id="banner-carousel">
            <div class="banner-track" id="banner-track"></div>
            <div class="banner-dots" id="banner-dots"></div>
        </div>

        <!-- Search Bar -->
        <div class="search-container">
            <input type="text" id="faq-search"
                   placeholder="Tìm kiếm thắc mắc..."
                   value="${escapeHtml(currentSearchQuery)}"
                   autocomplete="off">
        </div>

        <!-- Category Grid -->
        <div class="category-grid" id="category-grid">
            <button class="cat-item ${currentCategory === 'all' ? 'active' : ''}" data-category="all">📋 Tất cả</button>
            <button class="cat-item ${currentCategory === 'hoc_phi' ? 'active' : ''}" data-category="hoc_phi">💰 Học phí</button>
            <button class="cat-item ${currentCategory === 'dang_ky' ? 'active' : ''}" data-category="dang_ky">📝 Đăng ký</button>
            <button class="cat-item ${currentCategory === 'tot_nghiep' ? 'active' : ''}" data-category="tot_nghiep">🎓 Tốt nghiệp</button>
            <button class="cat-item ${currentCategory === 'hoc_bong' ? 'active' : ''}" data-category="hoc_bong">🏅 Học bổng</button>
            <button class="cat-item ${currentCategory === 'ktx' ? 'active' : ''}" data-category="ktx">🏠 KTX</button>
        </div>

        <!-- FAQ List -->
        <div class="faq-list" id="faq-list"></div>
    `;

    // Render banners
    renderBannerCarousel();

    // Render FAQs
    filterAndRenderFAQs();

    // Attach event listeners
    attachHomeEventListeners();
}

// ================================================================
// TV2: BANNER CAROUSEL
// ================================================================
function renderBannerCarousel() {
    const track = document.getElementById('banner-track');
    const dots = document.getElementById('banner-dots');

    if (!track || !dots || allBanners.length === 0) return;

    // Render slides
    track.innerHTML = allBanners.map((banner) => `
        <div class="banner-slide" style="background: ${banner.gradient}">
            <div class="banner-icon">${banner.icon || '📢'}</div>
            <div class="banner-title">${escapeHtml(banner.title)}</div>
            <div class="banner-subtitle">${escapeHtml(banner.subtitle || '')}</div>
        </div>
    `).join('');

    // Render dots
    dots.innerHTML = allBanners.map((_, i) => `
        <button class="banner-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Slide ${i + 1}"></button>
    `).join('');

    // Dot click handlers
    dots.addEventListener('click', (e) => {
        const dot = e.target.closest('.banner-dot');
        if (dot) {
            const slideIndex = parseInt(dot.dataset.slide);
            goToSlide(slideIndex);
            resetBannerAutoPlay();
        }
    });

    // Start auto-play
    currentBannerIndex = 0;
    startBannerAutoPlay();
}

function goToSlide(index) {
    const track = document.getElementById('banner-track');
    const dots = document.querySelectorAll('.banner-dot');

    if (!track || index < 0 || index >= allBanners.length) return;

    currentBannerIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function nextSlide() {
    const nextIndex = (currentBannerIndex + 1) % allBanners.length;
    goToSlide(nextIndex);
}

function startBannerAutoPlay() {
    stopBannerAutoPlay();
    bannerInterval = setInterval(nextSlide, 4000);
}

function stopBannerAutoPlay() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }
}

function resetBannerAutoPlay() {
    stopBannerAutoPlay();
    startBannerAutoPlay();
}

// ================================================================
// TV2: SEARCH & CATEGORY FILTER
// ================================================================
function filterAndRenderFAQs() {
    let filtered = [...allFAQs];

    // Lọc theo danh mục
    if (currentCategory !== 'all') {
        filtered = filtered.filter(faq => faq.category === currentCategory);
    }

    // Lọc theo từ khóa tìm kiếm
    if (currentSearchQuery.trim()) {
        const query = currentSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        );
    }

    renderFAQList(filtered);
}

function renderFAQList(faqs) {
    const listEl = document.getElementById('faq-list');
    if (!listEl) return;

    if (faqs.length === 0) {
        listEl.innerHTML = `
            <div class="faq-empty">
                <div class="faq-empty-icon">🔍</div>
                <div class="faq-empty-text">Không tìm thấy câu hỏi phù hợp</div>
            </div>
        `;
        return;
    }

    listEl.innerHTML = faqs.map((faq) => {
        const categoryLabel = CATEGORY_NAMES[faq.category] || faq.category;
        return `
            <div class="faq-card" data-faq-id="${faq.faq_id}" onclick="window._openModal('${faq.faq_id}')">
                <div class="faq-card-header">
                    <div class="faq-question">${escapeHtml(faq.question)}</div>
                    <span class="faq-category-badge">${categoryLabel}</span>
                </div>
                <div class="faq-meta">
                    <span class="faq-meta-item">👍 ${faq.likes || 0}</span>
                    <span class="faq-meta-item">👎 ${faq.dislikes || 0}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ================================================================
// TV2: MODAL POPUP
// ================================================================
function openModal(faqId) {
    const faq = allFAQs.find(f => f.faq_id === faqId);
    if (!faq) return;

    currentModalFaq = faq;

    const modal = document.getElementById('faq-modal');
    const categoryLabel = CATEGORY_NAMES[faq.category] || faq.category;

    // Cập nhật nội dung modal
    document.getElementById('modal-category').textContent = categoryLabel;
    document.getElementById('modal-question').textContent = faq.question;
    document.getElementById('modal-answer').textContent = faq.answer;
    document.getElementById('like-count').textContent = faq.likes || 0;
    document.getElementById('dislike-count').textContent = faq.dislikes || 0;

    // Kiểm tra trạng thái đã vote
    const votedFAQs = JSON.parse(localStorage.getItem('tlu_voted_faqs') || '{}');
    const btnLike = document.getElementById('btn-like');
    const btnDislike = document.getElementById('btn-dislike');

    // Reset trạng thái
    btnLike.classList.remove('voted', 'disabled');
    btnDislike.classList.remove('voted', 'disabled');

    if (votedFAQs[faqId]) {
        if (votedFAQs[faqId] === 'like') {
            btnLike.classList.add('voted');
            btnDislike.classList.add('disabled');
        } else {
            btnDislike.classList.add('voted');
            btnLike.classList.add('disabled');
        }
    }

    // Kiểm tra trạng thái bookmark
    const savedFAQs = JSON.parse(localStorage.getItem('tlu_saved_faqs') || '[]');
    const btnBookmark = document.getElementById('btn-bookmark');
    if (savedFAQs.includes(faqId)) {
        btnBookmark.classList.add('saved');
        btnBookmark.innerHTML = '⭐ Đã lưu';
    } else {
        btnBookmark.classList.remove('saved');
        btnBookmark.innerHTML = '🔖 Lưu';
    }

    // Hiển thị modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('faq-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
    currentModalFaq = null;

    // TV3: Dừng audio khi đóng modal (TV3 sẽ implement chi tiết)
    // Gọi hàm stopAudio nếu TV3 đã định nghĩa
    if (typeof window.stopAudio === 'function') {
        window.stopAudio();
    }
}

// ================================================================
// TV2: RATING SYSTEM (Like / Dislike)
// ================================================================
async function rateFAQ(faqId, type) {
    // Kiểm tra đã vote chưa
    const votedFAQs = JSON.parse(localStorage.getItem('tlu_voted_faqs') || '{}');
    if (votedFAQs[faqId]) {
        showToast('Bạn đã đánh giá câu hỏi này rồi! 😊');
        return;
    }

    // Cập nhật dữ liệu local
    const faq = allFAQs.find(f => f.faq_id === faqId);
    if (faq) {
        if (type === 'like') {
            faq.likes = (faq.likes || 0) + 1;
        } else {
            faq.dislikes = (faq.dislikes || 0) + 1;
        }
    }

    // Cập nhật Firestore (nếu có _docId từ Firestore)
    if (faq && faq._docId) {
        try {
            const faqRef = doc(db, "faqs", faq._docId);
            await updateDoc(faqRef, {
                [type === 'like' ? 'likes' : 'dislikes']: increment(1)
            });
            console.log(`✅ Đã cập nhật ${type} cho ${faqId} trên Firestore`);
        } catch (error) {
            console.warn("⚠️ Không thể cập nhật Firestore:", error.message);
        }
    }

    // Lưu trạng thái vote vào localStorage
    votedFAQs[faqId] = type;
    localStorage.setItem('tlu_voted_faqs', JSON.stringify(votedFAQs));

    // Cập nhật UI modal
    if (currentModalFaq && currentModalFaq.faq_id === faqId) {
        document.getElementById('like-count').textContent = faq.likes || 0;
        document.getElementById('dislike-count').textContent = faq.dislikes || 0;

        const btnLike = document.getElementById('btn-like');
        const btnDislike = document.getElementById('btn-dislike');

        if (type === 'like') {
            btnLike.classList.add('voted');
            btnDislike.classList.add('disabled');
            btnLike.style.animation = 'pulse 0.4s ease';
        } else {
            btnDislike.classList.add('voted');
            btnLike.classList.add('disabled');
            btnDislike.style.animation = 'pulse 0.4s ease';
        }
    }

    // Cập nhật lại danh sách FAQ (cập nhật số like/dislike)
    filterAndRenderFAQs();

    showToast(type === 'like' ? 'Cảm ơn bạn đã đánh giá! 👍' : 'Cảm ơn góp ý của bạn! 📝');
}

// ================================================================
// TV2: TOAST NOTIFICATION
// ================================================================
function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    // Tự xóa sau 3 giây
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ================================================================
// TV2: ATTACH EVENT LISTENERS CHO TRANG CHỦ
// ================================================================
function attachHomeEventListeners() {
    // Search input - lọc real-time
    const searchInput = document.getElementById('faq-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            filterAndRenderFAQs();
        });

        // Focus search khi bấm vào container
        searchInput.focus();
        // Đặt cursor cuối text nếu có giá trị
        if (searchInput.value) {
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }

    // Category buttons - lọc theo danh mục
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) {
        categoryGrid.addEventListener('click', (e) => {
            const catBtn = e.target.closest('.cat-item');
            if (!catBtn) return;

            const category = catBtn.dataset.category;
            currentCategory = category;

            // Cập nhật UI active
            document.querySelectorAll('.cat-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.category === category);
            });

            filterAndRenderFAQs();
        });
    }
}

// ================================================================
// TV2: MODAL EVENT LISTENERS (Gắn 1 lần khi DOM ready)
// ================================================================
function initModalListeners() {
    const modal = document.getElementById('faq-modal');
    if (!modal) return;

    // Nút đóng
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Click backdrop đóng modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Phím ESC đóng modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Nút Like
    const btnLike = document.getElementById('btn-like');
    if (btnLike) {
        btnLike.addEventListener('click', () => {
            if (currentModalFaq) {
                rateFAQ(currentModalFaq.faq_id, 'like');
            }
        });
    }

    // Nút Dislike
    const btnDislike = document.getElementById('btn-dislike');
    if (btnDislike) {
        btnDislike.addEventListener('click', () => {
            if (currentModalFaq) {
                rateFAQ(currentModalFaq.faq_id, 'dislike');
            }
        });
    }

    // Nút Bookmark - TV3 sẽ implement logic đầy đủ
    // TV2 chỉ vẽ UI và toggle cơ bản bằng localStorage
    const btnBookmark = document.getElementById('btn-bookmark');
    if (btnBookmark) {
        btnBookmark.addEventListener('click', () => {
            if (!currentModalFaq) return;

            const faqId = currentModalFaq.faq_id;
            let savedFAQs = JSON.parse(localStorage.getItem('tlu_saved_faqs') || '[]');

            if (savedFAQs.includes(faqId)) {
                // Bỏ lưu
                savedFAQs = savedFAQs.filter(id => id !== faqId);
                btnBookmark.classList.remove('saved');
                btnBookmark.innerHTML = '🔖 Lưu';
                showToast('Đã bỏ lưu câu hỏi ✖️');
            } else {
                // Lưu
                savedFAQs.push(faqId);
                btnBookmark.classList.add('saved');
                btnBookmark.innerHTML = '⭐ Đã lưu';
                showToast('Đã lưu câu hỏi! ⭐');
            }

            localStorage.setItem('tlu_saved_faqs', JSON.stringify(savedFAQs));
        });
    }

    // Nút Audio - TV3 sẽ implement logic playAudio()
    const btnAudio = document.getElementById('btn-play-audio');
    if (btnAudio) {
        btnAudio.addEventListener('click', () => {
            // TODO: TV3 sẽ thay thế bằng hàm playAudio() gọi Cloud TTS
            if (typeof window.playAudio === 'function') {
                window.playAudio(currentModalFaq);
            } else {
                showToast('🔊 Chức năng nghe AI đọc sắp ra mắt!');
            }
        });
    }
}

// ================================================================
// 8. XỬ LÝ THANH ĐIỀU HƯỚNG (TV1 + TV2 cập nhật)
// ================================================================
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Xóa class active ở các nút khác
        navItems.forEach(nav => nav.classList.remove('active'));
        // Thêm class active vào nút được bấm
        item.classList.add('active');

        // Logic thay đổi nội dung main-content
        const target = item.getAttribute('data-target');

        if (target === 'home') {
            // TV2: Render trang chủ
            renderHomeTab();
        } else if (target === 'saved') {
            stopBannerAutoPlay();
            // TV3 sẽ implement renderSavedTab()
            if (typeof window.renderSavedTab === 'function') {
                window.renderSavedTab();
            } else {
                mainContent.innerHTML = `
                    <div class="faq-empty" style="margin-top: 60px;">
                        <div class="faq-empty-icon">🔖</div>
                        <div class="faq-empty-text">Câu hỏi Đã lưu</div>
                        <p style="color: var(--text-secondary); margin-top: 8px; font-size: 0.85em;">
                            Các câu hỏi bạn lưu từ Trang chủ sẽ hiển thị tại đây.
                        </p>
                    </div>
                `;
            }
        } else if (target === 'history') {
            stopBannerAutoPlay();
            // TV5 sẽ implement renderHistoryTab()
            if (typeof window.renderHistoryTab === 'function') {
                window.renderHistoryTab();
            } else {
                mainContent.innerHTML = `
                    <div class="faq-empty" style="margin-top: 60px;">
                        <div class="faq-empty-icon">📋</div>
                        <div class="faq-empty-text">Lịch sử Yêu cầu</div>
                        <p style="color: var(--text-secondary); margin-top: 8px; font-size: 0.85em;">
                            Biểu đồ thống kê và danh sách Ticket sẽ hiển thị tại đây.
                        </p>
                    </div>
                `;
            }
        }
    });
});

// ================================================================
// TV3: RENDER TAB ĐÃ LƯU
// ================================================================
function renderSavedTab() {
    stopBannerAutoPlay();

    const savedFAQIds = JSON.parse(localStorage.getItem('tlu_saved_faqs') || '[]');

    if (savedFAQIds.length === 0) {
        mainContent.innerHTML = `
            <div class="faq-empty" style="margin-top: 60px;">
                <div class="faq-empty-icon">🔖</div>
                <div class="faq-empty-text">Chưa có câu hỏi nào được lưu</div>
                <p style="color: var(--text-secondary); margin-top: 8px; font-size: 0.85em;">
                    Mở một câu hỏi và bấm <strong>🔖 Lưu</strong> để thêm vào đây.
                </p>
            </div>
        `;
        return;
    }

    // Lọc các FAQ đã lưu từ danh sách allFAQs
    const savedFAQs = allFAQs.filter(faq => savedFAQIds.includes(faq.faq_id));

    mainContent.innerHTML = `
        <div style="padding: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                    ⭐ Câu hỏi đã lưu
                    <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); margin-left: 6px;">(${savedFAQs.length})</span>
                </h2>
                <button id="clear-saved-btn" style="
                    background: none;
                    border: 1px solid var(--border-color, #e0e0e0);
                    border-radius: 8px;
                    padding: 6px 12px;
                    font-size: 0.78rem;
                    color: var(--text-secondary);
                    cursor: pointer;
                ">🗑 Xóa tất cả</button>
            </div>
            <div class="faq-list" id="saved-faq-list">
                ${savedFAQs.length === 0
                    ? `<div class="faq-empty">
                           <div class="faq-empty-icon">❓</div>
                           <div class="faq-empty-text">Không tìm thấy dữ liệu câu hỏi đã lưu</div>
                       </div>`
                    : savedFAQs.map(faq => {
                        const categoryLabel = CATEGORY_NAMES[faq.category] || faq.category;
                        return `
                            <div class="faq-card" data-faq-id="${faq.faq_id}" onclick="window._openModal('${faq.faq_id}')">
                                <div class="faq-card-header">
                                    <div class="faq-question">${escapeHtml(faq.question)}</div>
                                    <span class="faq-category-badge">${categoryLabel}</span>
                                </div>
                                <div class="faq-meta">
                                    <span class="faq-meta-item">👍 ${faq.likes || 0}</span>
                                    <span class="faq-meta-item">👎 ${faq.dislikes || 0}</span>
                                    <span class="faq-meta-item" style="margin-left: auto; color: var(--accent-color, #667eea);">⭐ Đã lưu</span>
                                </div>
                            </div>
                        `;
                    }).join('')
                }
            </div>
        </div>
    `;

    // Xử lý nút xóa tất cả
    const clearBtn = document.getElementById('clear-saved-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn xóa tất cả câu hỏi đã lưu?')) {
                localStorage.removeItem('tlu_saved_faqs');
                showToast('Đã xóa tất cả câu hỏi đã lưu ✖️');
                renderSavedTab();
            }
        });
    }
}

// Đăng ký ra global để nav handler gọi được
window.renderSavedTab = renderSavedTab;

// ================================================================
// UTILITY FUNCTIONS
// ================================================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================================================
// GLOBAL EXPORTS (Cho các TV khác sử dụng)
// ================================================================
// TV3 cần: openModal, closeModal, currentModalFaq, allFAQs
window._openModal = function (faqId) { openModal(faqId); };
window._closeModal = function () { closeModal(); };
window._getAllFAQs = function () { return allFAQs; };
window._getCurrentModalFaq = function () { return currentModalFaq; };
window._showToast = function (msg) { showToast(msg); };

// TV5 cần: refreshList khi TV4 tạo ticket mới
window.refreshList = function () {
    // TV5 sẽ override hàm này
    console.log("refreshList() chưa được implement bởi TV5");
};

// ================================================================
// KHỞI TẠO KHI DOM READY
// ================================================================
initModalListeners();