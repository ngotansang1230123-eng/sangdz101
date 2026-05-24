// Danh sách các key VIP hợp lệ
const VALID_KEYS = ["tansang-key1ne", "tansang-090411", "090411"];

// Bộ nhớ đệm lưu trữ tài khoản sau khi đọc file
let accountData = [];

// 1. Chuyển đổi giữa các Tab mượt mà
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// 2. Mở sâu link ứng dụng (Facebook/TikTok), nếu lỗi sẽ mở bằng trình duyệt
function fallbackLink(event, webUrl) {
    // Để ứng dụng chạy ngầm xử lý deeplink trước, nếu không cài app sẽ nhảy sang web sau 1.5s
    setTimeout(() => {
        window.location.href = webUrl;
    }, 1500);
}

// 3. Xác thực Key & Lấy IP thiết bị thực tế
async function verifyKey() {
    const inputKey = document.getElementById('key-input').value.trim();
    const errorMsg = document.getElementById('error-msg');

    if (VALID_KEYS.includes(inputKey)) {
        errorMsg.innerText = "";
        document.getElementById('auth-box').classList.add('hidden');
        document.getElementById('premium-dashboard').classList.remove('hidden');

        // Gọi API lấy IP thật của thiết bị công khai
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            document.getElementById('ip-display').innerText = data.ip;
        } catch (err) {
            document.getElementById('ip-display').innerText = "192.168.1.1 (Local)";
        }

        // Tải dữ liệu tài khoản từ file tk.txt
        fetchAccounts();
    } else {
        errorMsg.innerText = "Mã thiết lập Key không chính xác hoặc đã hết hạn!";
    }
}

// 4. Đọc dữ liệu từ file tk.txt và tách chuỗi theo ký tự ";"
async function fetchAccounts() {
    try {
        // Tải file tk.txt cùng thư mục
        const response = await fetch('tk.txt');
        const text = await response.text();
        
        // Loại bỏ khoảng trắng thừa, xuống dòng và tách mảng bằng dấu ";"
        const rawArray = text.replace(/\s+/g, '').split(';').filter(item => item !== "");
        
        // Cấu trúc lại mảng theo từng cặp: cứ 2 phần tử liên tiếp là 1 Cặp tài khoản/mật khẩu
        accountData = [];
        for (let i = 0; i < rawArray.length; i += 2) {
            if (rawArray[i] && rawArray[i+1]) {
                accountData.push({
                    id: Date.now() + i, // Tạo ID ngẫu nhiên không trùng lặp
                    username: rawArray[i],
                    password: rawArray[i+1]
                });
            }
        }
        renderAccounts();
    } catch (error) {
        console.error("Không tìm thấy dữ liệu file tk.txt hoặc định dạng sai.", error);
        // Dữ liệu mẫu dự phòng nếu người dùng không chạy trên môi trường server để test nhanh
        accountData = [
            { id: 1, username: "sangdz", password: "vip-sang" },
            { id: 2, username: "vip111", password: "vip22" }
        ];
        renderAccounts();
    }
}

// 5. Render danh sách tài khoản ra giao diện
function renderAccounts() {
    const container = document.getElementById('account-list');
    container.innerHTML = "";

    if (accountData.length === 0) {
        container.innerHTML = `<p style="color:#64748b; text-align:center; font-size:14px; margin-top:20px;">Hệ thống trống - Toàn bộ tài khoản đã bị hủy</p>`;
        return;
    }

    accountData.forEach((acc, index) => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.innerHTML = `
            <span class="card-index">#${index + 1}</span>
            <div class="clickable-field user-field" onclick="copyData('${acc.username}', ${acc.id})">
                TK: ${acc.username}
            </div>
            <div class="clickable-field pass-field" onclick="copyData('${acc.password}', ${acc.id})">
                MK: ${acc.password}
            </div>
        `;
        container.appendChild(card);
    });
}

// 6. Xử lý chức năng Sao chép & Kích hoạt bộ đếm ngược 5 phút hủy tài khoản
function copyData(text, accId) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`ĐÃ SAO CHÉP: ${text}`);
        
        // Kích hoạt bộ đếm 5 phút (5 * 60 * 1000 ms = 300000ms)
        // Để thử nghiệm nhanh bạn có thể đổi thành 5000 (5 giây) xem hiệu ứng tự xóa
        setTimeout(() => {
            removeAccountFromUI(accId);
        }, 5 * 60 * 1000);
    });
}

// 7. Xóa tài khoản khỏi bộ nhớ tạm màn hình và tự động sắp xếp lại vị trí
function removeAccountFromUI(id) {
    accountData = accountData.filter(acc => acc.id !== id);
    renderAccounts(); // Re-render lại danh sách theo thứ tự mới tăng dần
    showToast("HỆ THỐNG: 1 Tài khoản đã hết hạn 5 phút và tự hủy khỏi Menu!");
}

// 8. Hàm hiển thị thông báo góc màn hình
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
