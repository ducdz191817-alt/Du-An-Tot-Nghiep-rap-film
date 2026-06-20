Write-Host "=== TEST API BACKEND ===" -ForegroundColor Cyan

# 1. Backend Status
Write-Host "`n[1] Kiem tra backend..." -ForegroundColor Yellow
$status = Invoke-RestMethod -Uri "http://localhost:5000/api/status" -Method GET
Write-Host "  -> $($status.message)" -ForegroundColor Green

# 2. Login
Write-Host "`n[2] Dang nhap john@gmail.com..." -ForegroundColor Yellow
$loginBody = @{ email = "john@gmail.com"; password = "userpassword123" } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.token
Write-Host "  -> OK - User: $($login.data.username) | Tuoi: $($login.data.age) | Role: $($login.data.role)" -ForegroundColor Green

# 3. Get Movies
Write-Host "`n[3] Lay danh sach phim..." -ForegroundColor Yellow
$movies = Invoke-RestMethod -Uri "http://localhost:5000/api/movies" -Method GET
Write-Host "  -> OK - Tim thay $($movies.count) phim:" -ForegroundColor Green
foreach ($m in $movies.data) {
    Write-Host "     - $($m.title) | Rating: $($m.rating) | Status: $($m.status)"
}

# 4. Get Showtimes
$nowShowingMovie = $movies.data | Where-Object { $_.status -eq "now-showing" } | Select-Object -First 1
Write-Host "`n[4] Lay lich chieu phim: $($nowShowingMovie.title)..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$showtimes = Invoke-RestMethod -Uri "http://localhost:5000/api/showtimes/movie/$($nowShowingMovie._id)" -Method GET -Headers $headers
Write-Host "  -> OK - $($showtimes.count) suat chieu:" -ForegroundColor Green
foreach ($s in $showtimes.data | Select-Object -First 3) {
    $time = [DateTime]$s.startTime
    Write-Host "     - $($time.ToString('HH:mm')) | $($s.theater.name) | $($s.format) | $($s.ticketPrice.ToString('N0'))VND"
}

# 5. Create Booking
$showtime = $showtimes.data | Select-Object -First 1
Write-Host "`n[5] Tao booking (ghe C3, C4)..." -ForegroundColor Yellow
$bookBody = @{
    showtimeId = $showtime._id
    seats = @("C3", "C4")
    concessions = @()
    paymentMethod = "vnpay"
} | ConvertTo-Json
$booking = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method POST -Body $bookBody -ContentType "application/json" -Headers $headers
Write-Host "  -> OK - Booking ID: $($booking.data.booking._id)" -ForegroundColor Green
Write-Host "     Ghe: $($booking.data.booking.seats -join ', ') | Tong tien: $($booking.data.booking.totalPrice.ToString('N0'))VND" -ForegroundColor Green

# 6. Create VNPay Payment URL
$bookingId = $booking.data.booking._id
$totalPrice = $booking.data.booking.totalPrice
Write-Host "`n[6] Tao URL thanh toan VNPay..." -ForegroundColor Yellow
$vnpBody = @{
    bookingId = $bookingId
    amount = $totalPrice
    orderInfo = "Thanh toan ve xem phim booking $bookingId"
} | ConvertTo-Json
$vnpay = Invoke-RestMethod -Uri "http://localhost:5000/api/payments/vnpay/create" -Method POST -Body $vnpBody -ContentType "application/json" -Headers $headers
Write-Host "  -> OK - URL VNPay duoc tao thanh cong!" -ForegroundColor Green
Write-Host "     URL (100 ky tu dau): $($vnpay.payUrl.Substring(0, [Math]::Min(100, $vnpay.payUrl.Length)))..." -ForegroundColor Cyan

Write-Host "`n=== KET QUA TONG KET ===" -ForegroundColor Cyan
Write-Host "[OK] Backend: Hoat dong" -ForegroundColor Green
Write-Host "[OK] Login: $($login.data.username) (tuoi: $($login.data.age))" -ForegroundColor Green
Write-Host "[OK] Movies: $($movies.count) phim trong DB" -ForegroundColor Green
Write-Host "[OK] Showtimes: $($showtimes.count) suat chieu" -ForegroundColor Green
Write-Host "[OK] Booking: $($booking.data.booking._id)" -ForegroundColor Green
Write-Host "[OK] VNPay URL: Da tao thanh cong" -ForegroundColor Green
Write-Host "`n>>> De hoan tat thanh toan: Mo trinh duyet, nhap URL VNPay, chon NCB, dung the sandbox" -ForegroundColor Yellow
