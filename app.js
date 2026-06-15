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
        category: "tin_chi",
        question: "Làm thế nào để đăng ký tín chỉ trực tuyến và thời gian đăng ký thường vào lúc nào?",
        answer: "Sinh viên đăng ký tín chỉ trực tuyến qua web https://sinhvien1.tlu.edu.vn/ thời gian sẽ được phòng Đào Tạo thông báo, lịch đăng ký sẽ chia theo từng khóa",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_002",
        category: "tin_chi",
        question: "Hạn hủy hoặc rút bớt học phần/tín chỉ đã đăng ký là khi nào và thủ tục ra sao?",
        answer: "Sinh viên có thể hủy học phần đăng ký trong 2 tuần đầu của giai đoạn học, sinh viên lên Phòng Đào Tạo nhà A4 để hủy học phần",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_003",
        category: "tin_chi",
        question: "Số lượng tín chỉ tối thiểu và tối đa được phép đăng ký?",
        answer: "Khối lượng tối thiểu không ít hơn 11 tín và tối đa không vượt quá 26 tín, trong 1 vài trường hợp đặc biệt ( sinh viên có sức khỏe yếu, sinh viên học 2 văn bằng,....) nhà trường sẽ xem xét điều chỉnh giới hạn khối lượng học tập cho sinh viên",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_004",
        category: "tin_chi",
        question: "Tổng số tín chỉ của các ngành học là bao nhiêu?",
        answer: "Quy chế phân định trình độ năm học của sinh viên dựa trên số tín chỉ tích lũy tăng dần qua từng năm. Qua đó, bạn có thể thấy được tổng số tín chỉ thiết kế tối đa cho toàn khóa của từng nhóm ngành:  \n\nNhóm ngành Kinh tế, Kinh doanh và Quản lý, Ngôn ngữ:\n\nSinh viên năm thứ nhất: Tích lũy dưới 35 tín chỉ.  \n\nSinh viên năm thứ hai: Tích lũy từ 35 đến 70 tín chỉ.  \n\nSinh viên năm thứ ba: Tích lũy từ 71 đến 102 tín chỉ.  \n\nSinh viên năm thứ tư: Tích lũy từ 103 đến 130 tín chỉ.(Khung chương trình đào tạo của nhóm ngành này được thiết kế tối đa quanh mốc 130 tín chỉ ).  \n\nNhóm ngành Kỹ thuật, Công nghệ, Quản lý xây dựng:\n\nSinh viên năm thứ nhất: Tích lũy dưới 37 tín chỉ.  \n\nSinh viên năm thứ hai: Tích lũy từ 37 đến 72 tín chỉ.  \n\nSinh viên năm thứ ba: Tích lũy từ 73 đến 108 tín chỉ.  \n\nSinh viên năm thứ tư: Tích lũy từ 109 đến 142 tín chỉ.  \n\nSinh viên năm thứ năm: Tích lũy từ 143 tín chỉ trở lên.(Khung chương trình đào tạo của nhóm ngành này được thiết kế dài hơn, đạt từ 143 tín chỉ trở lên )",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_005",
        category: "tin_chi",
        question: "Quy định về việc học lại và học cải thiện?",
        answer: "Đối với học phần bắt buộc thì sinh viên phải đăng ký lại chính học phần đó, học phần tự chọn thì sinh viên có thể chọn học lại học phần đó hoặc chọn 1 học phần khác, học lại thì không quá 6% tổng số tín sẽ không bị hạ bằng còn học cải thiện không giới hạn",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_006",
        category: "hoc_phi",
        question: "Đóng học phí chậm có bị sao không ?",
        answer: "Sinh viên thực hiện không theo đúng quy định về nộp học phí sẽ bị xử lý như sau:\n- Đối với sinh viên đang học các môn học: Khóa tài khoản đăng ký học ít nhất 01 học kỳ cho đến khi sinh viên hoàn thành học phí;\n- Đối với sinh viên đang trong thời gian thực hiện Học phần tốt nghiệp: Sinh viên không được bảo vệ Học phần tốt nghiệp. Sinh viên chỉ được bảo vệ Học phần tốt nghiệp cùng với các đợt sau (theo kế hoạch trường tổ chức) nếu đã hoàn thành học phí.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_007",
        category: "hoc_phi",
        question: "Thời gian thu học phí là khi nào ?",
        answer: "- Học phí của học kỳ chính và học kỳ thực hiện Học phần tốt nghiệp được thu một lần vào tuần học thứ tư của mỗi giai đoạn học. \n- Học phí của học kỳ song song với học kỳ chính, học kỳ hè được thu vào tuần học thứ hai của mỗi kỳ học",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_008",
        category: "hoc_phi",
        question: "Những ai được giảm học phí ?",
        answer: "- Đối tượng được giảm 70% học phí: Sinh viên người dân tộc thiểu số (không phải là người dân tộc thiểu số rất ít người) ở thôn/bản đặc biệt khó khăn, xã khu vực III vùng dân tộc và miền núi, xã đặc biệt khó khăn vùng bãi ngang ven biển hải đảo theo quy định của cơ quan có thẩm quyền.\n- Đối tượng được giảm 50% học phí: Sinh viên là con cán bộ, công chức, viên chức, công nhân mà cha hoặc mẹ bị tai nạn lao động hoặc mắc bệnh nghề nghiệp được hưởng trợ cấp thường xuyên.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_009",
        category: "hoc_phi",
        question: "Những ai được miễn học phí ?",
        answer: "- Đối tượng 1: Sinh viên thuộc đối tượng theo quy định tại Pháp lệnh Ưu đãi người có công với cách mạng\n- Đối tượng 2: Sinh viên bị khuyết tật.\n- Đối tượng 3: Sinh viên (tuổi không quá 22) không có nguồn nuôi dưỡng thuộc đối tượng hưởng trợ cấp xã hội hàng tháng theo quy định tại khoản 1 và 2 Điều 5 Nghị định số 20/2021/NĐ-CP ngày 15/3/2021 của Chính phủ.\n- Đối tượng 4: Sinh viên là người dân tộc thiểu có cha hoặc mẹ hoặc cả cha và mẹ hoặc ông bà (trong trường hợp ở với ông bà) thuộc hộ nghèo và hộ cận nghèo theo quy định của Thủ tướng Chính phủ.\n- Đối tượng 5: Sinh viên người dân tộc thiểu số rất ít người (Cống, Mảng, Pu Péo, Si La, Cờ Lao, Bố Y, La Ha, Ngái, Chứt, Ơ Đu, Brâu, Rơ Măm, Lô Lô, Lự, Pà Thẻn, La Hủ) ở vùng có điều kiện kinh tế - xã hội khó khăn hoặc đặc biệt khó khăn\n- Đối tượng 6: Sinh viên hệ cử tuyển.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_010",
        category: "hoc_phi",
        question: "Con của người có công với cách mạng muốn nộp hồ sơ miễn học phí thì cần những giấy tờ gì ?",
        answer: "Hồ sơ cần nộp bao gồm:\n1/ Đơn đề nghị  miễn giảm học phí \n2/ Bản sao Giấy khai sinh;\n3/ Giấy xác nhận của cơ quan quản lý đối tượng người có công có con thuộc diện miễn giảm học phí;\n4/ Bản sao thẻ Thương bệnh binh của bố/mẹ (nếu có).",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_011",
        category: "khao_thi",
        question: "Tôi bị trùng lịch thi hai môn vào cùng một ca thi thì phải làm thế nào để xin hoãn thi?",
        answer: "Trường hợp bị trùng lịch thi, sinh viên làm Đơn xin hoãn thi (theo mẫu tại văn phòng Khoa/Phòng Khảo thí) và nộp minh chứng lịch thi bị trùng trước ngày thi ít nhất 3 ngày làm việc. Nhà trường sẽ xem xét giải quyết cho sinh viên thi bổ sung vào đợt thi phụ hoặc ghép với khóa sau.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_012",
        category: "khao_thi",
        question: "Sau khi công bố điểm thi, nếu muốn phúc khảo (chấm phúc tra) bài thi tự luận thì nộp đơn ở đâu và hạn chót là khi nào?",
        answer: "Sinh viên nộp Đơn xin phúc khảo bài thi tại Phòng Khảo thí và Đảm bảo chất lượng (tầng 1, toà A4). Thời hạn nhận đơn phúc khảo là trong vòng 7 ngày làm việc kể từ ngày phòng Khảo thí công bố điểm thi chính thức trên hệ thống. Lệ phí phúc khảo tính theo quy định hiện hành của nhà trường.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_013",
        category: "khao_thi",
        question: "Đang làm bài thi trắc nghiệm cuối kỳ trên máy tính mà hệ thống bị sập hoặc máy bị mất mạng thì điểm số được tính thế nào?",
        answer: "Khi gặp sự cố kỹ thuật (mất mạng, sập nguồn máy tính), sinh viên phải giữ nguyên vị trí và báo ngay cho Cán bộ coi thi (giám thị). Giám thị sẽ lập biên bản xác nhận sự cố, phối hợp với kỹ thuật viên để khôi phục lại lượt thi (giữ nguyên thời gian và các câu đã làm) hoặc bố trí cho sinh viên làm lại bài thi bằng đề dự phòng.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_014",
        category: "khao_thi",
        question: "Thời hạn nộp chứng chỉ tiếng Anh quốc tế (IELTS/TOEIC) để xét miễn thi học phần tiếng Anh hoặc xét tốt nghiệp là khi nào?",
        answer: "Nhà trường tiếp nhận chứng chỉ tiếng Anh quốc tế (còn thời hạn 2 năm) theo các đợt trong năm học. Để xét miễn thi học phần, sinh viên nộp trước tuần học thứ 2 của học kỳ. Để xét tốt nghiệp, sinh viên phải nộp chứng chỉ chậm nhất là 4 tuần trước khi Hội đồng xét tốt nghiệp họp (theo thông báo cụ thể của từng đợt tốt nghiệp).",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_015",
        category: "khao_thi",
        question: "Đến ngày thi mà tôi bị mất thẻ sinh viên thì có được vào phòng thi không và cần mang giấy tờ gì thay thế?",
        answer: "Sinh viên bị mất thẻ sinh viên vẫn được vào phòng thi nếu xuất trình được một trong các giấy tờ tùy thân có dán ảnh hợp lệ như: Căn cước công dân (CCCD), Hộ chiếu, hoặc Giấy phép lái xe. Đồng thời, sinh viên cần chủ động liên hệ Phòng Công tác chính trị & Quản lý sinh viên để làm thủ tục cấp lại thẻ trước đợt thi tiếp theo.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_016",
        category: "hanh_chinh",
        question: "Làm thế nào để xin cấp Giấy chứng nhận sinh viên (để làm vé xe buýt, hoãn nghĩa vụ quân sự...)?",
        answer: "Sinh viên đăng ký trực tuyến qua cổng thông tin sinh viên hoặc ứng dụng của trường (hoặc nộp form tại Phòng Công tác chính trị và Quản lý sinh viên). Sau khi hệ thống xác nhận, sinh viên nhận giấy hẹn và đến lấy kết quả trực tiếp tại phòng chức năng theo đúng thời gian quy định.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_017",
        category: "hanh_chinh",
        question: "Rút lại học bạ hoặc bằng tốt nghiệp THPT chính thức đã nộp khi nhập học thì cần làm những thủ tục gì?",
        answer: "Sinh viên mang theo Thẻ sinh viên hoặc Căn cước công dân đến Phòng Đào tạo. Tại đây, sinh viên điền vào mẫu đơn xin rút hồ sơ/văn bằng, nêu rõ lý do (ví dụ: mượn đi công chứng, thôi học...). Sau khi được Ban Giám hiệu phê duyệt, phòng Đào tạo sẽ bàn giao lại giấy tờ gốc và ký biên bản giao nhận.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_018",
        category: "hanh_chinh",
        question: "Mất thẻ sinh viên thì phải làm thủ tục cấp lại ở đâu và lệ phí như thế nào?",
        answer: "Sinh viên đến Phòng Công tác chính trị và Quản lý sinh viên để làm thủ tục xin cấp lại thẻ. Tại đây, bạn sẽ điền form đề nghị cấp lại thẻ sinh viên, nộp kèm 1 ảnh 3x4 và đóng lệ phí cấp lại theo quy định của nhà trường. Thời gian nhận lại thẻ mới thường từ 5 - 7 ngày làm việc.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_019",
        category: "hanh_chinh",
        question: "Nếu bản thân bị ốm hoặc có việc gia đình đột xuất phải nghỉ học nhiều ngày thì cần làm thủ tục xin phép như thế nào để không bị tính là nghỉ tự do?",
        answer: "Sinh viên phải làm Đơn xin nghỉ học tạm thời (có chữ ký xác nhận của phụ huynh nếu nghỉ dài ngày) kèm theo minh chứng hợp pháp (như giấy ra viện, giấy xác nhận của bệnh viện nếu nghỉ ốm). Đơn nộp về Văn phòng Khoa quản lý ngành học của sinh viên và gửi bản sao cho giảng viên bộ môn để được xem xét hoãn thi hoặc không bị cấm thi do nghỉ quá số buổi.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_020",
        category: "hanh_chinh",
        question: "Nếu phát hiện thông tin cá nhân (Họ tên, ngày sinh, quê quán, số CCCD...) trên hệ thống quản lý sinh viên của trường bị sai thì cần gặp ai để sửa?",
        answer: "Sinh viên cần mang theo Thẻ sinh viên và bản sao công chứng các giấy tờ pháp lý liên quan (Giấy khai sinh, CCCD) đến phòng Đào tạo để làm thủ tục đính chính. Việc chỉnh sửa thông tin cần được thực hiện càng sớm càng tốt để tránh ảnh hưởng đến việc làm bằng tốt nghiệp và các giấy tờ hành chính sau này.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_021",
        category: "ky_thuat",
        question: "Nếu quên mật khẩu để đăng nhập thì sao?",
        answer: "Sinh viên có thể nhấn nút \"Quên mật khẩu\" ngay tại form đăng nhập để hệ thống kích hoạt luồng xác thực và gửi liên kết đặt lại mật khẩu về email khôi phục.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_022",
        category: "ky_thuat",
        question: "Làm sao để cập nhật nhanh nhất các thông báo khẩn cấp của nhà trường như lịch nghỉ học, hạn đóng học phí?",
        answer: "Ngay khi truy cập vào Màn hình Trang chủ (Home Tab), sinh viên sẽ thấy hệ thống tự động hiển thị các thông tin quan trọng nhất tại Bảng tin Thông báo (Carousel Banner) dạng thanh trượt ở đầu trang.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_023",
        category: "ky_thuat",
        question: "Làm thế nào để biết yêu cầu hỗ trợ (Ticket) của mình đã được nhà trường tiếp nhận và xử lý hay chưa?",
        answer: "Sinh viên có thể theo dõi tiến độ tại màn hình \"Lịch sử yêu cầu\". Tại đây có biểu đồ thống kê tổng quan tỉ lệ trạng thái các câu hỏi, đi kèm danh sách và được gán nhãn màu trực quan như đỏ, vàng, xanh.",
        likes: 0,
        dislikes: 0
    },
    {
        faq_id: "faq_024",
        category: "ky_thuat",
        question: "Nếu gặp thắc mắc về điểm thi, lịch học hoặc các thủ tục hành chính hành chính khác, tôi phải liên hệ với ai trên hệ thống?",
        answer: "Sinh viên có thể vào trang \"Gửi phản hồi\", Tại đây, bạn điền tiêu đề câu hỏi, điền nội dung và chọn phòng ban cần giải đáp.",
        likes: 0,
        dislikes: 0
    }
];

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