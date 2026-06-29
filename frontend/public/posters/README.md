# 📁 Thư mục Poster Phim

Ném file ảnh poster vào đây, web sẽ tự dùng.

## Cách dùng

1. Đặt tên file đơn giản, không dấu, không khoảng trắng:
   - ✅ `avengers.jpg`
   - ✅ `inside-out-2.jpg`
   - ❌ `Avengers Secret Wars.jpg`

2. Định dạng hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`

3. File sẽ được truy cập tại:
   ```
   http://localhost:5173/posters/ten-file.jpg
   ```

4. Cập nhật `posterUrl` trong database thành:
   ```
   /posters/ten-file.jpg
   ```

## Ví dụ

| File ảnh            | posterUrl trong DB      |
|---------------------|-------------------------|
| avengers.jpg        | /posters/avengers.jpg   |
| inside-out-2.jpg    | /posters/inside-out-2.jpg |
| batman.webp         | /posters/batman.webp    |
