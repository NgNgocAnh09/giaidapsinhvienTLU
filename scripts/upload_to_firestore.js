/**
 * ================================================================
 * SCRIPT ĐẨY DỮ LIỆU FAQ & BANNER LÊN GOOGLE CLOUD FIRESTORE
 * ================================================================
 * 
 * Mô tả: Script Node.js dùng Firebase Admin SDK để upload dữ liệu
 *         từ file JSON lên Firestore database.
 * 
 * Cách sử dụng:
 *   1. Cài đặt: npm install firebase-admin
 *   2. Tải file serviceAccountKey.json từ Firebase Console:
 *      → Project Settings → Service Accounts → Generate New Private Key
 *   3. Đặt file serviceAccountKey.json vào thư mục scripts/
 *   4. Chạy: node scripts/upload_to_firestore.js
 * 
 * Lưu ý: KHÔNG commit file serviceAccountKey.json lên GitHub!
 * ================================================================
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ========== CẤU HÌNH FIREBASE ADMIN ==========
// Đường dẫn đến file Service Account Key
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'serviceAccountKey.json');

// Kiểm tra file key có tồn tại không
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Không tìm thấy file serviceAccountKey.json!');
    console.error('   Hướng dẫn:');
    console.error('   1. Vào Firebase Console → Project Settings → Service Accounts');
    console.error('   2. Nhấn "Generate New Private Key"');
    console.error('   3. Lưu file vào: scripts/serviceAccountKey.json');
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "tlu-helpdesk-v2"
});

const db = admin.firestore();

// ========== HÀM UPLOAD DỮ LIỆU ==========

/**
 * Upload một mảng dữ liệu lên Firestore collection
 * @param {string} collectionName - Tên collection trên Firestore
 * @param {Array} dataArray - Mảng dữ liệu cần upload
 * @param {string} idField - Tên trường dùng làm Document ID
 */
async function uploadCollection(collectionName, dataArray, idField) {
    console.log(`\n📤 Đang upload ${dataArray.length} documents vào collection "${collectionName}"...`);

    const batch = db.batch();
    let count = 0;

    for (const item of dataArray) {
        const docId = item[idField];
        if (!docId) {
            console.warn(`⚠️ Bỏ qua item không có ${idField}:`, item);
            continue;
        }

        const docRef = db.collection(collectionName).doc(docId);
        batch.set(docRef, item, { merge: true }); // merge: true để không ghi đè nếu đã có
        count++;
        console.log(`   ✅ ${docId}: ${item.question || item.title || 'N/A'}`);
    }

    await batch.commit();
    console.log(`\n🎉 Đã upload thành công ${count}/${dataArray.length} documents vào "${collectionName}"!`);
}

// ========== HÀM CHÍNH ==========

async function main() {
    console.log('================================================================');
    console.log('  SCRIPT ĐẨY DỮ LIỆU LÊN FIRESTORE - TLU HELPDESK');
    console.log('================================================================');

    try {
        // 1. Đọc file dữ liệu FAQ
        const faqsPath = path.join(__dirname, '..', 'data', 'faqs.json');
        if (!fs.existsSync(faqsPath)) {
            console.error(`❌ Không tìm thấy file: ${faqsPath}`);
            process.exit(1);
        }
        const faqs = JSON.parse(fs.readFileSync(faqsPath, 'utf8'));
        console.log(`📂 Đã đọc ${faqs.length} câu hỏi từ data/faqs.json`);

        // 2. Đọc file dữ liệu Banner
        const bannersPath = path.join(__dirname, '..', 'data', 'banners.json');
        if (!fs.existsSync(bannersPath)) {
            console.error(`❌ Không tìm thấy file: ${bannersPath}`);
            process.exit(1);
        }
        const banners = JSON.parse(fs.readFileSync(bannersPath, 'utf8'));
        console.log(`📂 Đã đọc ${banners.length} banner từ data/banners.json`);

        // 3. Upload FAQs
        await uploadCollection('faqs', faqs, 'faq_id');

        // 4. Upload Banners
        await uploadCollection('banners', banners, 'id');

        console.log('\n================================================================');
        console.log('  ✅ HOÀN TẤT! Tất cả dữ liệu đã được đẩy lên Firestore.');
        console.log('================================================================');

    } catch (error) {
        console.error('\n❌ Lỗi khi upload:', error.message);
        process.exit(1);
    }
}

main();
