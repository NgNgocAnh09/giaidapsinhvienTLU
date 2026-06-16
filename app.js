// ================================================================
// CỔNG HỖ TRỢ HỌC VỤ TLU - MAIN APPLICATION
// TV1: Firebase Auth, Theme, Navigation
// TV2: Firestore, Banner, Search, FAQ, Modal, Rating
// ================================================================

// ========== 1. IMPORT FIREBASE SDK ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, updateDoc, increment, getDoc, setDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

// Tên danh mục để hiển thị
const CATEGORY_NAMES = {
    "all": "Tất cả",
    "tin_chi": "Tín chỉ",
    "hoc_phi": "Học phí",
    "khao_thi": "Khảo thí",
    "hanh_chinh": "Hành chính",
    "ky_thuat": "Kỹ thuật"
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
            console.warn("⚠️ Firestore FAQs trống");
            return [];
        }
        const faqs = [];
        querySnapshot.forEach((docSnap) => {
            faqs.push({ ...docSnap.data(), _docId: docSnap.id });
        });
        console.log(`✅ Đã tải ${faqs.length} FAQ từ Firestore`);
        return faqs;
    } catch (error) {
        console.warn("⚠️ Lỗi Firestore:", error.message);
        return [];
    }
}

async function loadBannersFromFirestore() {
    try {
        const querySnapshot = await getDocs(collection(db, "banners"));
        if (querySnapshot.empty) {
            return [];
        }
        const banners = [];
        querySnapshot.forEach((docSnap) => {
            banners.push(docSnap.data());
        });
        console.log(`✅ Đã tải ${banners.length} banner từ Firestore`);
        return banners;
    } catch (error) {
        console.warn("⚠️ Lỗi load banners:", error.message);
        return [];
    }
}

// ================================================================
// TV2: KHỞI TẠO TAB TRANG CHỦ
// ================================================================
let currentUserSavedFAQs = [];

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

    // Hàm phụ: Tải Bookmark của user từ Firestore
    const email = window.getCurrentUserEmail();
    const loadBookmarks = async () => {
        if (!email) return;
        const userRef = doc(db, "user_bookmarks", email);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            currentUserSavedFAQs = docSnap.data().saved_faqs || [];
        } else {
            await setDoc(userRef, { saved_faqs: [] });
        }
    };

    // Load dữ liệu song song cả 3 thứ: Banners, FAQs, và Bookmarks
    const [banners, faqs] = await Promise.all([
        loadBannersFromFirestore(),
        loadFAQsFromFirestore(),
        loadBookmarks()
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
            <button class="cat-item ${currentCategory === 'tin_chi' ? 'active' : ''}" data-category="tin_chi">📚 Tín chỉ</button>
            <button class="cat-item ${currentCategory === 'hoc_phi' ? 'active' : ''}" data-category="hoc_phi">💰 Học phí</button>
            <button class="cat-item ${currentCategory === 'khao_thi' ? 'active' : ''}" data-category="khao_thi">📝 Khảo thí</button>
            <button class="cat-item ${currentCategory === 'hanh_chinh' ? 'active' : ''}" data-category="hanh_chinh">🏛️ Hành chính</button>
            <button class="cat-item ${currentCategory === 'ky_thuat' ? 'active' : ''}" data-category="ky_thuat">🛠️ Kỹ thuật</button>
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
        btnBookmark.addEventListener('click', async () => {
            if (!currentModalFaq) return;
            const email = window.getCurrentUserEmail();
            if (!email) {
                showToast('Vui lòng đăng nhập để lưu câu hỏi!');
                return;
            }

            const faqId = currentModalFaq.faq_id;
            const userRef = doc(db, "user_bookmarks", email);
            
            // Khóa nút tạm thời để tránh click spam gây lỗi database
            btnBookmark.style.pointerEvents = 'none';

            try {
                if (currentUserSavedFAQs.includes(faqId)) {
                    // Bỏ lưu: Xóa khỏi mảng trên Firestore
                    await updateDoc(userRef, { saved_faqs: arrayRemove(faqId) });
                    currentUserSavedFAQs = currentUserSavedFAQs.filter(id => id !== faqId); // Cập nhật RAM
                    
                    btnBookmark.classList.remove('saved');
                    btnBookmark.innerHTML = '🔖 Lưu';
                    showToast('Đã bỏ lưu câu hỏi ✖️');
                } else {
                    // Lưu: Thêm vào mảng trên Firestore
                    await updateDoc(userRef, { saved_faqs: arrayUnion(faqId) });
                    currentUserSavedFAQs.push(faqId); // Cập nhật RAM
                    
                    btnBookmark.classList.add('saved');
                    btnBookmark.innerHTML = '⭐ Đã lưu';
                    showToast('Đã đồng bộ lưu lên Cloud! ⭐');
                }
            } catch (error) {
                console.error("Lỗi đồng bộ Bookmark:", error);
                showToast('Lỗi mạng khi lưu câu hỏi ❌');
            } finally {
                btnBookmark.style.pointerEvents = 'auto'; // Mở lại nút
            }
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

    const savedFAQIds = currentUserSavedFAQs;

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
        clearBtn.addEventListener('click', async () => {
            const email = window.getCurrentUserEmail();
            if (confirm('Bạn có chắc muốn xóa tất cả câu hỏi đã lưu trên hệ thống?')) {
                try {
                    // Xóa mảng trên Firestore
                    await updateDoc(doc(db, "user_bookmarks", email), { saved_faqs: [] });
                    currentUserSavedFAQs = []; // Xóa trên RAM
                    showToast('Đã xóa tất cả dữ liệu lưu trữ ✖️');
                    renderSavedTab(); // Vẽ lại giao diện trống
                } catch (error) {
                    showToast('Có lỗi xảy ra khi xóa ❌');
                }
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

// ================================================================
// TV3: AI GIỌNG NÓI & XỬ LÝ ÂM THANH (Tuấn Hiệp)
// ================================================================

// 1. Biến toàn cục để theo dõi tiến trình phát nhạc (giúp fix bug âm thanh ma)
let currentAudioPlayer = null;

// 2. Link API Cloud Functions chính thức của bạn
const TTS_API_URL = "https://asia-southeast1-tribal-sunbeam-474413-q8.cloudfunctions.net/text_to_speech_api";

// 3. Hàm gọi AI đọc văn bản
window.playAudio = async function(faq) {
    if (!faq || !faq.answer) return;

    const btnAudio = document.getElementById('btn-play-audio');
    
    // Nếu nhạc đang phát mà người dùng bấm lần nữa -> Coi như lệnh Dừng (Pause)
    if (currentAudioPlayer && !currentAudioPlayer.paused) {
        window.stopAudio();
        return;
    }

    // Tránh việc click liên tục spam request lên server khi đang tải
    if (btnAudio.classList.contains('loading')) {
        window._showToast('⏳ Đang tạo âm thanh, vui lòng đợi...');
        return;
    }

    // Hiển thị trạng thái đang tải
    btnAudio.innerHTML = '⏳ Đang tạo giọng nói...';
    btnAudio.classList.add('loading');

    try {
        // Gửi nội dung câu trả lời lên Google Cloud Functions
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: faq.answer })
        });

        const data = await response.json();
        
        if (data.audio_url) {
            console.log("✅ Đã nhận link MP3 từ Storage:", data.audio_url);
            
            // Khởi tạo Audio Player với link MP3 trả về
            currentAudioPlayer = new Audio(data.audio_url);
            
            // Sự kiện khi bắt đầu phát nhạc
            currentAudioPlayer.onplay = () => {
                btnAudio.innerHTML = '⏹️ Đang phát... (Click để dừng)';
                btnAudio.classList.remove('loading');
                btnAudio.classList.add('playing');
                // Hiệu ứng nhấp nháy cho nút (tùy chọn)
                btnAudio.style.animation = 'pulse 1.5s infinite';
            };

            // Sự kiện khi đọc xong tự động reset nút
            currentAudioPlayer.onended = () => {
                window.stopAudio();
            };

            // Bắt đầu phát
            currentAudioPlayer.play();
            
        } else {
            window._showToast('❌ Lỗi tạo âm thanh: ' + (data.error || 'Server không phản hồi'));
            window.stopAudio(); // Reset trạng thái nút
        }
    } catch (error) {
        console.error("Lỗi kết nối TTS API:", error);
        window._showToast('❌ Không thể kết nối máy chủ AI Giọng nói');
        window.stopAudio(); // Reset trạng thái nút
    }
};

// 4. Hàm Dừng Âm Thanh (Dùng để bắt sự kiện tắt Modal - Fix lỗi "Âm thanh ma")
window.stopAudio = function() {
    // Nếu có nhạc đang phát thì ép dừng và tua về 0
    if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer.currentTime = 0;
        currentAudioPlayer = null;
    }
    
    // Reset lại giao diện của nút Nghe AI
    const btnAudio = document.getElementById('btn-play-audio');
    if (btnAudio) {
        btnAudio.innerHTML = '🔊 Nghe AI đọc';
        btnAudio.classList.remove('playing', 'loading');
        btnAudio.style.animation = 'none';
    }
};

// ================================================================
// TV5: TAB LỊCH SỬ & BIỂU ĐỒ THỐNG KÊ 
// ================================================================

// Biến lưu trữ biểu đồ để tránh lỗi vẽ đè khi load lại tab
let historyChartInstance = null;

// Mock data: Tạm thời dùng mảng này để test UI khi chưa có API Python của Zoho Desk
let mockTickets = [
    { id: "TCK_001", subject: "Lỗi đăng ký tín chỉ học kỳ 1", department: "DEPT_01", status: "Open", date: "16/06/2026" },
    { id: "TCK_002", subject: "Thắc mắc về thủ tục làm lại thẻ sinh viên", department: "DEPT_02", status: "Closed", date: "10/06/2026" },
    { id: "TCK_003", subject: "Xác nhận đóng học phí qua chuyển khoản", department: "DEPT_03", status: "In Progress", date: "14/06/2026" }
];

// Hàm giả lập gọi API Zoho Desk (Cloud Function)
async function fetchUserTickets(email) {
    // Thực tế: return await fetch(`https://api-python-cloud-function/get_tickets?email=${email}`).then(res => res.json());
    return new Promise(resolve => setTimeout(() => resolve(mockTickets), 500)); 
}

// Hàm chính hiển thị Tab Lịch sử
window.renderHistoryTab = async function() {
    // Biến lưu trữ dữ liệu gốc và trạng thái bộ lọc
window.allUserTickets = []; 
let currentTicketSearch = '';
let currentTicketStatus = 'all';
let currentTicketDept = 'all';

// Hàm filter và render lại danh sách Ticket
window.filterAndRenderTickets = function() {
    let filtered = window.allUserTickets;

    // 1. Lọc theo tiêu đề (Search)
    if (currentTicketSearch.trim()) {
        const query = currentTicketSearch.toLowerCase().trim();
        filtered = filtered.filter(t => t.subject.toLowerCase().includes(query));
    }

    // 2. Lọc theo trạng thái (Status)
    if (currentTicketStatus !== 'all') {
        filtered = filtered.filter(t => t.status === currentTicketStatus);
    }

    // 3. Lọc theo phòng ban (Department)
    if (currentTicketDept !== 'all') {
        filtered = filtered.filter(t => t.department === currentTicketDept);
    }

    // Cập nhật lại giao diện danh sách
    const listEl = document.getElementById('ticket-list');
    if (!listEl) return;

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="faq-empty">
                <div class="faq-empty-icon">🔍</div>
                <div class="faq-empty-text">Không tìm thấy yêu cầu nào phù hợp với bộ lọc.</div>
            </div>`;
    } else {
        listEl.innerHTML = filtered.map(renderTicketCard).join('');
    }
};

// Hàm chính hiển thị Tab Lịch sử (Đã cập nhật thêm Toolbar)
window.renderHistoryTab = async function() {
    if (typeof stopBannerAutoPlay === 'function') stopBannerAutoPlay();

    const mainContent = document.getElementById('main-app-content');
    
    const userEmail = window.getCurrentUserEmail();
    if (!userEmail) {
        mainContent.innerHTML = `<div class="faq-empty"><div class="faq-empty-icon">🔒</div><div class="faq-empty-text">Vui lòng đăng nhập để xem lịch sử.</div></div>`;
        return;
    }

    mainContent.innerHTML = `
        <div class="faq-loading">
            <div class="loading-spinner"></div>
            <p>Đang tải dữ liệu...</p>
        </div>
    `;

    // Lấy dữ liệu và lưu vào biến toàn cục để dùng cho bộ lọc
    window.allUserTickets = await fetchUserTickets(userEmail);

    // Dựng giao diện tổng thể có Thanh công cụ Lọc
    mainContent.innerHTML = `
        <div style="padding: 16px;">
            <h2 style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 16px;">
                📋 Lịch sử Yêu cầu hỗ trợ
            </h2>

            <div style="background: var(--card-bg); padding: 16px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: 16px;">
                <canvas id="ticketStatusChart" style="max-height: 220px;"></canvas>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
                <input type="text" id="ticket-search" placeholder="🔍 Tìm kiếm tiêu đề..." 
                    style="flex: 1; min-width: 140px; padding: 10px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); outline: none;">
                
                <select id="ticket-status-filter" style="padding: 10px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); outline: none; background: var(--card-bg);">
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Open">🟡 Đang chờ xử lý</option>
                    <option value="In Progress">🔵 Đang xử lý</option>
                    <option value="Closed">🟢 Đã giải quyết</option>
                </select>

                <select id="ticket-dept-filter" style="padding: 10px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); outline: none; background: var(--card-bg);">
                    <option value="all">Tất cả phòng ban</option>
                    <option value="DEPT_01">Phòng Đào tạo</option>
                    <option value="DEPT_02">Phòng CT Sinh viên</option>
                    <option value="DEPT_03">Phòng TC Kế toán</option>
                </select>
            </div>

            <div id="ticket-list" style="display: flex; flex-direction: column; gap: 12px;"></div>
        </div>
    `;

    // Vẽ biểu đồ với toàn bộ dữ liệu ban đầu
    renderPieChart(window.allUserTickets);

    // Hiển thị danh sách lần đầu tiên
    window.filterAndRenderTickets();

    // ============================================
    // Gắn Event Listeners cho các công cụ lọc
    // ============================================
    document.getElementById('ticket-search').addEventListener('input', (e) => {
        currentTicketSearch = e.target.value;
        window.filterAndRenderTickets();
    });

    document.getElementById('ticket-status-filter').addEventListener('change', (e) => {
        currentTicketStatus = e.target.value;
        window.filterAndRenderTickets();
    });

    document.getElementById('ticket-dept-filter').addEventListener('change', (e) => {
        currentTicketDept = e.target.value;
        window.filterAndRenderTickets();
    });
};
};

// Hàm render từng thẻ Ticket
function renderTicketCard(ticket) {
    // Xử lý Từ điển dữ liệu màu sắc & Trạng thái
    let statusColor, statusText;
    if (ticket.status === 'Open') { statusColor = 'var(--warning-color)'; statusText = 'Đang chờ xử lý'; }
    else if (ticket.status === 'In Progress') { statusColor = 'var(--primary-color)'; statusText = 'Đang xử lý'; }
    else if (ticket.status === 'Closed') { statusColor = 'var(--success-color)'; statusText = 'Đã giải quyết'; }

    const deptNames = {
        "DEPT_01": "Phòng Đào tạo",
        "DEPT_02": "Phòng Công tác Sinh viên",
        "DEPT_03": "Phòng Tài chính Kế toán"
    };

    return `
        <div class="faq-card" style="border-left-color: ${statusColor}; animation: fadeIn 0.3s ease;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 0.95rem; line-height: 1.4; color: var(--text-color);">${ticket.subject}</h4>
                <span style="background: ${statusColor}15; color: ${statusColor}; padding: 4px 8px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; white-space: nowrap; margin-left: 10px;">
                    ${statusText}
                </span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">🏢 ${deptNames[ticket.department]}</p>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;">📅 Ngày tạo: ${ticket.date}</p>

            ${ticket.status !== 'Closed' ? `
            <div style="display: flex; gap: 8px; border-top: 1px dashed var(--border-color); padding-top: 12px;">
                <button onclick="window.openEditModal('${ticket.id}')" style="flex: 1; padding: 8px; background: var(--bg-color); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    ✏️ Chỉnh sửa
                </button>
                <button onclick="window.cancelTicket('${ticket.id}')" style="flex: 1; padding: 8px; background: var(--bg-color); border: 1px solid var(--danger-color); color: var(--danger-color); border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: all 0.2s;">
                    🗑️ Hủy yêu cầu
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// Hàm vẽ biểu đồ tròn (Chart.js)
function renderPieChart(tickets) {
    const ctx = document.getElementById('ticketStatusChart');
    if (!ctx) return;

    const openCount = tickets.filter(t => t.status === 'Open').length;
    const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
    const closedCount = tickets.filter(t => t.status === 'Closed').length;

    if (historyChartInstance) { historyChartInstance.destroy(); }

    historyChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đang chờ xử lý', 'Đang xử lý', 'Đã giải quyết'],
            datasets: [{
                data: [openCount, inProgressCount, closedCount],
                backgroundColor: ['#f59e0b', '#0056b3', '#10b981'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { font: { family: 'Inter' } } }
            },
            cutout: '70%'
        }
    });
}

// ================================================================
// TV5: XỬ LÝ HÀNH ĐỘNG (CHỈNH SỬA / HỦY / REFRESH)
// ================================================================

// Nạp chồng (Override) lại hàm refreshList để TV4 gọi sau khi đẩy form
window.refreshList = function () {
    console.log("TV5: Đã nhận tín hiệu tạo Ticket mới từ TV4, tiến hành refresh...");
    // Chỉ render lại nếu người dùng đang đứng ở tab Lịch sử
    const historyTabBtn = document.querySelector('.nav-item[data-target="history"]');
    if (historyTabBtn && historyTabBtn.classList.contains('active')) {
        window.renderHistoryTab();
    }
};

window.cancelTicket = function(ticketId) {
    if (confirm("Bạn có chắc chắn muốn hủy yêu cầu hỗ trợ này không?")) {
        // Thực tế: Gửi lệnh DELETE/UPDATE status qua Zoho API.
        // Ở đây mô phỏng xóa local để demo UI
        window.allUserTickets = window.allUserTickets.filter(t => t.id !== ticketId);
        mockTickets = mockTickets.filter(t => t.id !== ticketId);
        // Render lại danh sách, giữ nguyên bộ lọc đang chọn
        window.filterAndRenderTickets(); 
        
        // Cập nhật lại biểu đồ
        renderPieChart(window.allUserTickets);
    }
};

// Mở Modal Chỉnh sửa (Tái sử dụng cấu trúc UI của TV2)
window.openEditModal = function(ticketId) {
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const modalHtml = `
        <div class="modal-overlay active" id="tv5-edit-modal" style="z-index: 2000;">
            <div class="modal-content">
                <button class="modal-close" onclick="document.getElementById('tv5-edit-modal').remove()">&times;</button>
                <div class="modal-header"><span class="modal-category-badge">Chỉnh sửa Ticket</span></div>
                <div style="padding: 16px 24px 24px;">
                    <form id="tv5-edit-form">
                        <div style="margin-bottom: 16px;">
                            <label style="font-size: 0.85em; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: block;">Phòng ban tiếp nhận</label>
                            <select id="edit-dept" style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); font-size: 0.95em; outline: none;">
                                <option value="DEPT_01" ${ticket.department === 'DEPT_01' ? 'selected' : ''}>Phòng Đào tạo</option>
                                <option value="DEPT_02" ${ticket.department === 'DEPT_02' ? 'selected' : ''}>Phòng Công tác Sinh viên</option>
                                <option value="DEPT_03" ${ticket.department === 'DEPT_03' ? 'selected' : ''}>Phòng Tài chính Kế toán</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 24px;">
                            <label style="font-size: 0.85em; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; display: block;">Nội dung yêu cầu</label>
                            <textarea id="edit-subject" rows="3" style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 2px solid var(--border-color); font-size: 0.95em; outline: none; font-family: inherit;">${ticket.subject}</textarea>
                        </div>
                        <button type="button" onclick="window.submitEdit('${ticket.id}')" style="width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; transition: var(--transition);">Lưu thay đổi</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.submitEdit = function(ticketId) {
    const newDept = document.getElementById('edit-dept').value;
    const newSubject = document.getElementById('edit-subject').value;

    if (!newSubject.trim()) {
        alert("Nội dung yêu cầu không được để trống!");
        return;
    }

    // Thực tế: Đẩy API PUT/PATCH cập nhật Zoho Desk
    const ticket = mockTickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.department = newDept;
        ticket.subject = newSubject;
    }

    document.getElementById('tv5-edit-modal').remove();
    if(typeof window._showToast === 'function') window._showToast('Cập nhật thành công! ✅');
    window.renderHistoryTab(); // Tải lại danh sách để xem thay đổi
};
