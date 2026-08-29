# 📖 KỊCH BẢN DEMO HỆ THỐNG NOVACINEMA & BẢNG PHÂN CÔNG NHÓM (7 THÀNH VIÊN)
> **Dự án**: Hệ thống Đặt vé Xem phim & Quản lý Rạp Phim Trực tuyến NovaCinema  
> **Quy mô nhóm**: 7 Thành viên  
> **Mục đích**: Hướng dẫn chi tiết kịch bản thuyết trình, phân chia khối lượng công việc đồng đều cho từng thành viên và các bước thao tác màn hình khi báo cáo / bảo vệ đồ án.

---

## 👥 PHẦN 1: BẢNG PHÂN CÔNG NHIỆM VỤ CHI TIẾT (7 THÀNH VIÊN)

| TV | Vai trò | Phụ trách chính | Các chức năng Demo | Kỹ thuật cốt lõi giải thích |
|---|---|---|---|---|
| **TV 1** | **Trưởng nhóm / UX** | **Tổng quan & Tra cứu Phim** | • Tổng quan kiến trúc hệ thống<br>• Trang chủ Khách hàng & Bộ lọc phim<br>• Kiểm tra phân loại độ tuổi (P, T13, T16, T18) | • Thiết kế UX/UI & Responsive<br>• Middleware validate độ tuổi tài khoản |
| **TV 2** | **Core Dev 1** | **Đặt Ghế & Thuật toán Giữ ghế** | • Sơ đồ ghế chọn trực quan (BookingPage)<br>• Real-time Socket.IO Giữ ghế (2 Tab)<br>• Thuật toán Chặn Ghế mồ côi (Orphan Seat) | • Concurrency Socket.IO<br>• Thuật toán Chặn Ghế mồ côi (Client & Server) |
| **TV 3** | **Core Dev 2** | **Bắp nước, Coupon & Thanh toán** | • Chọn Combo Bắp nước & Mã giảm giá<br>• Thanh toán VietQR Ngân hàng động / Thẻ<br>• Tự động gửi Email xác nhận & QR Vé | • Tích hợp API VietQR Ngân hàng<br>• Email Service Nodemailer & QR Generator |
| **TV 4** | **Operational Staff** | **Soát vé QR Code & In vé POS** | • Xem Lịch sử đặt vé & QR Code<br>• Xác minh / Check-in QR Code tại quầy<br>• In vé giấy nhiệt chuẩn POS điện ảnh | • Chống dùng lại vé (Replay Attack Prevention)<br>• Định dạng Hóa đơn in nhiệt POS |
| **TV 5** | **Content Admin** | **Quản lý Phim & Lịch chiếu** | • Bảng điều khiển (Dashboard KPI)<br>• **Quản lý Phim: Auto-Import TMDB (1-Click)**<br>• Lịch chiếu & Chặn trùng giờ phòng chiếu | • Tích hợp API Quốc tế TMDB trong 2 giây<br>• Thuật toán phát hiện xung đột lịch chiếu |
| **TV 6** | **Facility Admin** | **Hạ tầng Rạp & Sơ đồ Ghế** | • Rạp & Phòng chiếu (Visual Seat Grid)<br>• **Khóa sơ đồ ghế khi phòng có vé bán**<br>• Loại phòng, Giá ghế, Bắp nước, Coupon | • Bảo vệ toàn vẹn dữ liệu vé (Data Integrity Guard)<br>• Cấu hình phụ thu loại ghế & Khóa ghế hỏng |
| **TV 7** | **Analytics Admin** | **Phân quyền RBAC & Báo cáo** | • Bảng Giá Vé (Ngày thường / Cuối tuần)<br>• Quản lý Người dùng & Phân quyền RBAC<br>• Báo cáo Doanh thu & Tỷ lệ lấp đầy (%) | • Phân quyền RBAC (User / Staff / Admin)<br>• Công thức tính tỷ lệ lấp đầy Occupancy Rate % |

---

## 🎬 PHẦN 2: KỊCH BẢN NÓI VÀ THAO TÁC MÀN HÌNH CHI TIẾT CỦA 7 THÀNH VIÊN

---

### 🟢 THÀNH VIÊN 1 — TỔNG QUAN HỆ THỐNG & TRA CỨU PHIM (Khách hàng Part 1)

> 🎙️ **Lời mở đầu**: *"Kính chào thầy cô và hội đồng. Em tên là [Tên TV1], Trưởng nhóm dự án NovaCinema. Sau đây em xin bắt đầu buổi demo với phần Tổng quan Kiến trúc và Trải nghiệm Tra cứu Phim của Khách hàng."*

#### 📍 Bước 1.1: Trang chủ & Bộ lọc Phim thông minh
- **Thao tác màn hình**: Vào Trang chủ (`http://localhost:5173`). Cuộn xem Banner phim hot, Danh sách phim đang chiếu, Phim sắp chiếu, Bộ lọc phim theo Rạp và Thể loại.
- **Lời thoại thuyết trình**:
  > *"Giao diện trang chủ được thiết kế theo phong cách hiện đại Dark Mode chuyên biệt cho rạp chiếu phim. Khách hàng có thể tra cứu lịch chiếu theo cụm rạp, theo ngày và theo từng bộ phim một cách mượt mà."*

#### 📍 Bước 1.2: Phân loại Độ tuổi Phim (Age Rating Safeguard)
- **Thao tác màn hình**: Click xem chi tiết Phim *Dune* hoặc *Mai* ➔ Cho hội đồng xem nhãn phân loại độ tuổi (**P, T13, T16, T18**).
- **Lời thoại thuyết trình**:
  > *"Hệ thống tuân thủ nghiêm ngặt quy định điện ảnh. Khi khách hàng chọn suất chiếu, Backend tự động kiểm tra độ tuổi của tài khoản khách hàng dựa trên ngày sinh. Nếu chưa đủ tuổi (ví dụ: Phim T18 nhưng user 16 tuổi), hệ thống sẽ chặn không cho tiến hành đặt vé."*

---

### 🟢 THÀNH VIÊN 2 — ĐẶT GHẾ REAL-TIME & THUẬT TOÁN GIỮ GHẾ (Khách hàng Part 2)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV2]. Em xin tiếp tục demo màn hình Đặt ghế với 2 tính năng kỹ thuật cốt lõi của dự án: Giữ ghế thời gian thực bằng Socket.IO và Thuật toán Chặn Ghế mồ côi."*

#### 📍 Bước 2.1: Demo Giữ ghế Thời gian thực (Socket.IO Real-time Hold)
- **Thao tác màn hình**: 
  - Mở 2 tab trình duyệt song song (1 tab Chrome thường, 1 tab Chrome ẩn danh).
  - Ở Tab 1 click chọn ghế `E5` và `E6`. 
  - Ngay lập tức trên màn hình Tab 2, ghế `E5` và `E6` chuyển đổi sang **màu cam (Đang có người giữ)**.
- **Lời thoại thuyết trình**:
  > *"Hệ thống áp dụng Socket.IO để đồng bộ trạng thái giữ ghế thời gian thực theo từng giây. Khi có khách chọn ghế, hệ thống khóa tạm thời trong 5 phút trên toàn bộ server, giải quyết triệt me vấn đề Race-condition khi nhiều khách hàng truy cập mua cùng một ghế."*

#### 📍 Bước 2.2: Demo Thuật toán Chặn Ghế mồ côi (Orphan Seat Algorithm)
- **Thao tác màn hình**: Cố tình click chọn ghế chừa trống đúng 1 ghế ở giữa 2 ghế đã chọn (VD: Ghế E4 đã chọn, chọn tiếp E6, chừa trống E5). Bấm *Tiếp tục*.
- **Màn hình**: Hiển thị popup báo lỗi màu đỏ và chặn không cho sang bước tiếp theo.
- **Lời thoại thuyết trình**:
  > *"Để tối ưu hóa doanh thu cho rạp, nhóm đã cài đặt Thuật toán Chặn Ghế mồ côi ở cả Client và Server. Thuật toán sẽ quét mảng ghế theo từng hàng, nếu người dùng cố tình để trống 1 ghế đơn lẻ giữa các ghế được chọn, hệ thống sẽ yêu cầu chọn lại."*

---

### 🟢 THÀNH VIÊN 3 — BẮP NƯỚC, COUPON, THANH TOÁN VIETQR & EMAIL (Khách hàng Part 3)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV3]. Em xin phụ trách demo luồng chọn Đồ ăn thức uống, Áp dụng Mã giảm giá và Thanh toán trực tuyến tự động."

#### 📍 Bước 3.1: Chọn Combo Bắp nước & Áp dụng Coupon
- **Thao tác màn hình**: Sang màn hình Chọn Bắp nước ➔ Tăng số lượng *Combo 1 Bắp 1 Nước* ➔ Chuyển sang màn hình Thanh toán (`PaymentPage`).
- **Nhập Coupon**: Nhập mã giảm giá `NOVASUMMER` ➔ Bấm Áp dụng ➔ Số tiền giảm hiển thị rõ ràng và trừ trực tiếp vào Tổng thanh toán.
- **Lời thoại thuyết trình**:
  > *"Khách hàng có thể dễ dàng gọi thêm đồ ăn uống đi kèm và áp dụng các mã giảm giá khuyến mãi. Hệ thống tự động tính toán tổng tiền chính xác đến từng đồng."*

#### 📍 Bước 3.2: Thanh toán VietQR & Gửi Email tự động kèm Vé QR
- **Thao tác màn hình**: 
  - Chọn phương thức **VietQR** ➔ Mã QR ngân hàng MB Bank tự động được sinh ra chứa chính xác Số tiền và Nội dung chuyển khoản chuẩn.
  - Bấm Thanh toán ngay ➔ Chuyển màn hình **Thành công** hiển thị Mã vé `TKT-260827-XXXX` và hình ảnh Mã QR Code.
  - **Mở Email**: Mở Hộp thư Email đăng ký ➔ Cho hội đồng xem Email tự động gửi kèm Vé điện tử và Mã QR.
- **Lời thoại thuyết trình**:
  > *"Tích hợp VietQR giúp khách hàng quét mã thanh toán ngân hàng tiện lợi. Ngay khi giao dịch hoàn tất, hệ thống tự động sinh Mã vé độc nhất, render mã QR Code và gửi Email xác nhận vé về cho khách hàng."*

---

### 🟡 THÀNH VIÊN 4 — CHECK-IN SOÁT VÉ QR CODE & IN VÉ CỨNG (Staff Operation)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV4]. Em xin phép đại diện nhóm demo Luồng Soát vé dành cho Nhân viên tại rạp và tính năng In vé giấy."*

#### 📍 Bước 4.1: Quét Mã QR & Check-in Soát vé tại Rạp
- **Thao tác màn hình**: Đăng nhập tài khoản Staff ➔ Mở trang tra cứu vé `/ticket/:ticketCode` (hoặc tab *Đặt vé* trong Admin).
- **Thao tác check-in**: Nhập/Dán Mã vé `TKT-260827-XXXX` vừa tạo từ Luồng Khách hàng ➔ Bấm Xác nhận ➔ Màn hình hiện thông báo xanh lá rực rỡ: **"CHECK-IN THÀNH CÔNG!"** cùng thông tin suất chiếu, thời gian check-in và tên nhân viên.
- **Lời thoại thuyết trình**:
  > *"Giao diện xác minh vé cho phép nhân viên rạp quét mã QR từ điện thoại của khách. Hệ thống tự động kiểm tra tính hợp lệ của vé và ghi nhận thời gian check-in tức thì."*

#### 📍 Bước 4.2: Demo Chống gian lận dùng lại vé (Replay Attack Prevention)
- **Thao tác màn hình**: Thử nhập lại chính mã vé vừa check-in một lần nữa ➔ Màn hình cảnh báo màu vàng: **"VÉ ĐÃ ĐƯỢC SỬ DỤNG LÚC [THỜI_GIAN]"**.
- **Lời thoại thuyết trình**:
  > *"Để chống tình trạng 1 vé bị chụp màn hình gửi cho nhiều người dùng chung, hệ thống lưu vết trạng thái `isCheckedIn`. Nếu quét lại vé đã qua cửa, hệ thống sẽ báo động vé đã được sử dụng."*

#### 📍 Bước 4.3: In vé giấy chuẩn nhiệt POS (Print Ticket)
- **Thao tác màn hình**: Bấm nút **In vé** tại đơn hàng ➔ Màn hình xuất Hóa đơn in nhiệt POS chuẩn điện ảnh hiện lên ➔ Bấm Xác nhận ➔ Trạng thái chuyển `isPrinted = true`.
- **Lời thoại thuyết trình**:
  > *"Đối với khách hàng có nhu cầu in vé giấy giữ làm kỷ niệm, nhân viên có thể in vé chuẩn định dạng POS nhiệt, đồng thời hệ thống lưu lại lịch sử lượt in."*

---

### 🔵 THÀNH VIÊN 5 — QUẢN LÝ PHIM (TMDB IMPORT) & LỊCH CHIẾU (Content Admin)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV5]. Em xin tiếp tục phần demo với nhóm chức năng Quản lý Phim và Xếp Lịch chiếu trong Admin."*

#### 📍 Bước 5.1: Dashboard Tổng quan & Tính năng 1-Click Auto Import từ TMDB
- **Thao tác màn hình**: Vào Admin ➔ Tab **Bảng điều khiển (Dashboard)** (Show 4 card KPI chỉ số). 
- **Chuyển sang Tab Quản lý Phim**: Bấm nút **"Nhập từ TMDB"** ➔ Gõ từ khóa *"Kung Fu Panda"* ➔ Chọn Phim ➔ Bấm Nhập.
- **Kết quả**: Chỉ trong 2 giây, toàn bộ Poster, Tên phim, Thể loại, Thời lượng, Mô tả, Đạo diễn và Độ tuổi được tải tự động về hệ thống.
- **Lời thoại thuyết trình**:
  > *"Nhóm đã tích hợp API TMDB Quốc tế. Thay vì ban quản trị phải nhập tay hàng chục bộ phim, tính năng Auto-Import cho phép tải toàn bộ thông tin chuẩn điện ảnh về cơ sở dữ liệu chỉ với 1-Click."*

#### 📍 Bước 5.2: Lịch chiếu & Thuật toán Chặn trùng lịch chiếu
- **Thao tác màn hình**: Chuyển sang Tab **Lịch chiếu** ➔ Bấm Tạo suất chiếu mới. Chọn Phim ➔ Chọn Phòng ➔ Chọn Khung giờ bị trùng đè lên một suất chiếu đã có.
- **Màn hình**: Báo lỗi trùng giờ chiếu trong cùng phòng và chặn không cho lưu.
- **Lời thoại thuyết trình**:
  > *"Hệ thống tự động tính toán thời lượng phim + thời gian dọn phòng 15 phút. Nếu người quản lý xếp lịch bị đè giờ chiếu trong cùng một phòng, hệ thống sẽ phát hiện xung đột lịch và ngăn chặn ngay."*

---

### 🔵 THÀNH VIÊN 6 — QUẢN LÝ HẠ TẦNG RẠP, SƠ ĐỒ GHẾ & ĐỒ ĂN (Facility Admin)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV6]. Em xin đại diện nhóm trình bày nhóm chức năng Quản lý Hạ tầng Rạp, Công cụ thiết kế sơ đồ ghế và Dịch vụ đính kèm."*

#### 📍 Bước 6.1: Visual Seat Grid Builder & Ràng buộc Bảo vệ Dữ liệu Vé
- **Thao tác màn hình**: Vào Tab **Rạp & Phòng chiếu** ➔ Mở trình vẽ sơ đồ ghế ma trận tương tác (*Visual Seat Grid Builder*).
- **Show điểm đắt giá (Data Integrity Safeguard)**: Mở 1 phòng chiếu **đã phát sinh vé bán** ➔ Hệ thống tự động báo đỏ cảnh báo và **khóa toàn bộ tính năng chỉnh sửa sơ đồ ghế**.
- **Lời thoại thuyết trình**:
  > *"Hệ thống hỗ trợ công cụ thiết kế ma trận ghế trực quan. Đặc biệt, để đảm bảo tính toàn vẹn dữ liệu, nếu phòng chiếu đã có khách mua vé cho các suất chiếu sắp tới, hệ thống sẽ tự động khóa sơ đồ ghế để bảo vệ dữ liệu vé đã bán."*

#### 📍 Bước 6.2: Loại phòng, Giá ghế, Bắp nước & Mã giảm giá
- **Thao tác màn hình**:
  - Tab **Loại phòng & Giá vé**: Cho xem cấu hình chuẩn phòng Standard 2D, VIP 3D, IMAX, SWEETBOX.
  - Tab **Quản lý giá ghế**: Show cấu hình phụ thu ghế VIP (+20k), ghế đôi và công cụ **Khóa ghế bảo trì (`isDisabled`)**.
  - Tab **Bắp nước** & Tab **Mã giảm giá**: Thêm/Sửa Combo bắp nước và tạo các chương trình khuyến mãi.
- **Lời thoại thuyết trình**:
  > *"Admin có thể tùy chỉnh chính sách phụ thu cho từng loại ghế, đánh dấu ghế hư hỏng bảo trì và dễ dàng tạo các chiến dịch khuyến mãi Bắp nước, Coupon để tăng doanh thu."*

---

### 🔵 THÀNH VIÊN 7 — PHÂN QUYỀN RBAC, BẢNG GIÁ & BÁO CÁO DOANH THU (Analytics Admin)

> 🎙️ **Lời mở đầu**: *"Em tên là [Tên TV7]. Em xin hoàn tất buổi demo với nhóm chức năng Quản lý Bảng giá, Phân quyền Hệ thống và Báo cáo Doanh thu Chuyên sâu."*

#### 📍 Bước 7.1: Bảng Giá Vé & Phân quyền Người dùng RBAC
- **Thao tác màn hình**:
  - Tab **Bảng Giá Vé**: Show giao diện cấu hình giá vé theo Ngày thường vs Cuối tuần / Ngày lễ.
  - Tab **Người dùng**: Xem danh sách người dùng (mật khẩu mã hóa). Đổi vai trò 1 tài khoản từ `User` ➔ `Staff` hoặc `Admin`. Demo nút Khóa/Mở khóa tài khoản (Lock/Unlock).
- **Lời thoại thuyết trình**:
  > *"Hệ thống phân quyền theo mô hình RBAC (Role-Based Access Control) chặt chẽ giữa 3 vai trò: User, Staff và Admin. Admin có thể khóa tài khoản vi phạm hoặc phân quyền nhân viên soát vé tại rạp."*

#### 📍 Bước 7.2: Báo cáo Doanh thu Chuyên sâu & Tỷ lệ lấp đầy (%)
- **Thao tác màn hình**: Vào Tab **Báo cáo doanh thu**.
  - Lọc doanh thu theo *Suất chiếu đã KẾT THÚC (Completed)* vs *Tổng doanh thu kể cả vé bán trước*.
  - Cho xem biểu đồ Top Phim doanh thu cao nhất, Biểu đồ doanh thu theo Cụm rạp.
  - Show chỉ số **Tỷ lệ lấp đầy phòng chiếu (Occupancy Rate %)**.
- **Lời thoại thuyết trình**:
  > *"Báo cáo doanh thu phân tích dữ liệu đa chiều, phân biệt rõ doanh thu thực tế đã chiếu và doanh thu bán trước. Đặc biệt chỉ số Occupancy Rate % giúp nhà quản lý đánh giá chính xác hiệu suất lấp đầy ghế của từng phòng chiếu và bộ phim."*

> 🎙️ **Lời kết chung nhóm (TV 1 Trưởng nhóm phát biểu kết thúc)**: *"Dạ phần trình bày demo 2 luồng chính và 12 chức năng của nhóm em đến đây là kết thúc. Chúng em xin chân thành cảm ơn thầy cô và hội đồng đã lắng nghe!"*

---

## 🎯 PHẦN 3: CHECKLIST PHÂN CÔNG 12 CHỨC NĂNG ADMIN CHO 7 THÀNH VIÊN

| Menu Sidebar | Mục Admin | TV Phụ trách | Thao tác chính cần show |
|---|---|---|---|
| **TỔNG QUAN** | 1. Bảng điều khiển | TV 5 | Xem 4 thẻ KPI chỉ số tổng quan |
| **NỘI DUNG** | 2. Quản lý Phim | TV 5 | **Auto-Import TMDB 1-click trong 2s** |
| | 3. Lịch chiếu | TV 5 | Xếp lịch, test cảnh báo trùng lịch |
| | 4. Rạp & Phòng chiếu | TV 6 | Visual Seat Grid, **Test khóa phòng có vé** |
| | 5. Loại phòng & Giá vé | TV 6 | Cấu hình chuẩn IMAX, SWEETBOX |
| | 6. Quản lý giá ghế | TV 6 | Phụ thu ghế VIP, khóa ghế hỏng (`isDisabled`) |
| | 7. Bắp nước & Combo | TV 6 | Quản lý danh sách Combo bắp nước |
| **GIAO DỊCH** | 8. Đặt vé | TV 4 | Check-in QR Code, **In vé cứng POS** |
| | 9. Mã giảm giá | TV 6 | Tạo Coupon mã khuyến mãi |
| | 10. Bảng Giá Vé | TV 7 | Cấu hình giá Ngày thường / Cuối tuần |
| | 11. Báo cáo doanh thu | TV 7 | Lọc doanh thu, **Occupancy Rate %** |
| **HỆ THỐNG** | 12. Người dùng | TV 7 | Phân quyền RBAC (User/Staff/Admin) |

---

## 💡 BÍ QUYẾT TRẢ LỜI CÂU HỎI HỘI ĐỒNG PHẢN BIỆN (FAQ)

1. **Hội đồng hỏi**: *"Làm sao hệ thống xử lý khi 2 người cùng đặt 1 ghế tại một thời điểm?"*
   - **TV 2 trả lời**: *"Dạ hệ thống dùng Socket.IO giữ ghế ngay khi người dùng click chọn. Dữ liệu giữ ghế được đồng bộ real-time tới tất cả client và chốt chặn bảo mật cuối cùng nằm ở Backend kiểm tra atomic trong MongoDB ạ."*

2. **Hội đồng hỏi**: *"Thuật toán Ghế mồ côi hoạt động thế nào?"*
   - **TV 2 trả lời**: *"Dạ thuật toán kiểm tra mảng ghế theo từng hàng. Nếu phát hiện khoảng trống = 1 ghế duy nhất được tạo ra bởi lựa chọn của người dùng, hệ thống sẽ báo lỗi và yêu cầu chọn lại ạ."*

3. **Hội đồng hỏi**: *"Lỡ khách hàng chụp ảnh mã QR vé cho người khác dùng thì sao?"*
   - **TV 4 trả lời**: *"Dạ khi nhân viên quét QR check-in lần đầu, trạng thái `isCheckedIn` chuyển thành `true` và lưu vết thời gian. Nếu mã đó được quét lại lần 2, hệ thống lập tức báo vàng 'Vé đã sử dụng lúc [thời gian]' để chống dùng lại vé ạ."*
