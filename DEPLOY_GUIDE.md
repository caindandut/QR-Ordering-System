# Hướng dẫn Deploy Backend lên Render

## 📋 Yêu cầu trước khi deploy

1. ✅ Đã kết nối thành công với TiDB
2. ✅ Có tài khoản Render (đăng ký tại https://render.com)
3. ✅ Code đã được push lên GitHub/GitLab/Bitbucket

## 🚀 Các bước deploy

### Bước 1: Chuẩn bị Repository

Đảm bảo code của bạn đã được commit và push lên Git repository:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin master
```

### Bước 2: Tạo Web Service trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Chọn **"Web Service"**
3. Kết nối repository của bạn (GitHub/GitLab/Bitbucket)
4. Chọn repository và branch (thường là `master` hoặc `main`)

### Bước 3: Cấu hình Service

Render sẽ tự động detect file `render.yaml` trong repository. Nếu không, bạn có thể cấu hình thủ công:

**Basic Settings:**
- **Name**: `qr-ordering-backend` (hoặc tên bạn muốn)
- **Region**: `Singapore` (hoặc region gần bạn nhất)
- **Branch**: `master` (hoặc branch chính của bạn)
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`

### Bước 4: Cấu hình Environment Variables

Trong phần **Environment** của Render service, thêm các biến môi trường sau:

#### 🔐 Bắt buộc:

1. **DATABASE_URL**
   ```
   mysql://username:password@host:port/database?sslaccept=strict
   ```
   - Lấy từ TiDB connection string của bạn
   - Ví dụ: `mysql://root:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/qr_ordering?sslaccept=strict`

2. **ACCESS_TOKEN_SECRET**
   ```
   (Một chuỗi ngẫu nhiên dài và bảo mật)
   ```
   - Tạo bằng: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **REFRESH_TOKEN_SECRET**
   ```
   (Một chuỗi ngẫu nhiên khác, dài và bảo mật)
   ```
   - Tạo bằng: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

#### ☁️ Cloudinary (nếu bạn dùng upload ảnh):

4. **CLOUDINARY_CLOUD_NAME**
   ```
   (Từ Cloudinary dashboard)
   ```

5. **CLOUDINARY_API_KEY**
   ```
   (Từ Cloudinary dashboard)
   ```

6. **CLOUDINARY_API_SECRET**
   ```
   (Từ Cloudinary dashboard)
   ```

#### ⚙️ Tùy chọn:

7. **PORT** (Render tự động set, không cần thêm)
8. **NODE_ENV**: `production`

### Bước 5: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Clone code từ repository
   - Chạy build command
   - Deploy service
3. Chờ quá trình build và deploy hoàn tất (thường mất 3-5 phút)

### Bước 6: Kiểm tra Deployment

1. Sau khi deploy xong, bạn sẽ nhận được URL dạng: `https://qr-ordering-backend.onrender.com`
2. Truy cập URL để kiểm tra health check:
   ```
   https://your-service-url.onrender.com/
   ```
   Nếu thấy response JSON với status "ok" → thành công! ✅

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra DATABASE_URL có đúng format không
- Đảm bảo TiDB cho phép kết nối từ IP của Render (có thể cần whitelist IP)
- Kiểm tra SSL settings trong connection string

### Lỗi: "Prisma migration failed"
- Đảm bảo database đã được tạo sẵn trên TiDB
- Kiểm tra quyền của user database có đủ để tạo bảng không
- Xem logs trong Render dashboard để biết lỗi cụ thể

### Lỗi: "Module not found"
- Kiểm tra `package.json` có đầy đủ dependencies không
- Đảm bảo build command chạy `npm install` trước

### Service bị sleep (Free plan)
- Render free plan sẽ sleep sau 15 phút không có traffic
- Request đầu tiên sau khi sleep sẽ mất 30-60 giây để wake up
- Để tránh sleep, có thể dùng cron job hoặc upgrade lên paid plan

## 📝 Lưu ý quan trọng

1. **TiDB Connection**: 
   - Đảm bảo TiDB cho phép kết nối từ bên ngoài
   - Có thể cần whitelist IP của Render (xem trong Render dashboard → Settings → Outbound IPs)

2. **Environment Variables**:
   - KHÔNG commit file `.env` lên Git
   - Tất cả secrets phải được set trong Render dashboard

3. **Database Migrations**:
   - Lần đầu deploy sẽ chạy migrations tự động
   - Nếu có migration mới, push code lên Git và Render sẽ tự động redeploy

4. **CORS**:
   - Hiện tại backend cho phép tất cả origins (`origin: "*"`)
   - Nên update để chỉ cho phép domain frontend của bạn khi deploy production

5. **Logs**:
   - Xem logs real-time trong Render dashboard → Logs tab
   - Rất hữu ích để debug khi có lỗi

## 🔗 Các bước tiếp theo

Sau khi backend đã deploy thành công:

1. Update frontend API URL để trỏ đến Render URL
2. Test các API endpoints
3. Deploy frontend (nếu cần)
4. Cấu hình custom domain (nếu có)

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
- Render dashboard logs
- TiDB connection status
- Environment variables đã set đúng chưa
- Network connectivity từ Render đến TiDB

---

**Chúc bạn deploy thành công! 🎉**

