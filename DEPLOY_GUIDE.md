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

#### 📍 Cách truy cập phần Environment Variables:

1. Sau khi tạo Web Service, bạn sẽ vào **Dashboard** của service đó
2. Ở thanh menu bên trái, click vào tab **"Environment"**
3. Bạn sẽ thấy một bảng với 2 cột: **Key** và **Value**
4. Ở phía dưới bảng, có nút **"Add Environment Variable"** hoặc **"+ Add"**

#### 🔧 Cách thêm từng biến môi trường:

**Cách thêm:**
- Click nút **"+ Add"** hoặc **"Add Environment Variable"**
- Nhập **Key** (tên biến) vào ô đầu tiên
- Nhập **Value** (giá trị) vào ô thứ hai
- Click **"Save Changes"** hoặc **"Add"**
- Lặp lại cho từng biến môi trường

---

#### 🔐 Các biến môi trường BẮT BUỘC cần thêm:

##### 1. **DATABASE_URL**

**Key:** `DATABASE_URL`

**Value:** 
```
mysql://2TQseLttWikAFta.root:YOUR_PASSWORD@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/qr_ordering?sslaccept=strict
```

**Cách lấy:**
- Lấy từ TiDB Cloud dashboard của bạn
- **QUAN TRỌNG**: Thay `YOUR_PASSWORD` bằng password thực tế của TiDB
- **QUAN TRỌNG**: Phải có `?sslaccept=strict` ở cuối URL
- Nếu password có ký tự đặc biệt, cần URL encode:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`

**Ví dụ:**
- Nếu password là `MyPass@123`, URL sẽ là:
  ```
  mysql://2TQseLttWikAFta.root:MyPass%40123@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/qr_ordering?sslaccept=strict
  ```

---

##### 2. **ACCESS_TOKEN_SECRET**

**Key:** `ACCESS_TOKEN_SECRET`

**Value:** (Một chuỗi ngẫu nhiên dài và bảo mật)

**Cách tạo:**
- Mở Terminal/Command Prompt trên máy tính của bạn
- Chạy lệnh:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Copy chuỗi kết quả (sẽ dài khoảng 128 ký tự)
- Paste vào **Value** của `ACCESS_TOKEN_SECRET`

**Ví dụ output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

---

##### 3. **REFRESH_TOKEN_SECRET**

**Key:** `REFRESH_TOKEN_SECRET`

**Value:** (Một chuỗi ngẫu nhiên KHÁC, dài và bảo mật)

**Cách tạo:**
- Chạy lại lệnh tương tự (để tạo chuỗi mới):
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Copy chuỗi kết quả MỚI (khác với ACCESS_TOKEN_SECRET)
- Paste vào **Value** của `REFRESH_TOKEN_SECRET`

**⚠️ Lưu ý:** Phải là chuỗi KHÁC với ACCESS_TOKEN_SECRET!

---

#### ☁️ Các biến môi trường cho Cloudinary (nếu bạn dùng upload ảnh):

##### 4. **CLOUDINARY_CLOUD_NAME**

**Key:** `CLOUDINARY_CLOUD_NAME`

**Value:** (Lấy từ Cloudinary dashboard → Settings → Product Environment Credentials)

---

##### 5. **CLOUDINARY_API_KEY**

**Key:** `CLOUDINARY_API_KEY`

**Value:** (Lấy từ Cloudinary dashboard → Settings → Product Environment Credentials)

---

##### 6. **CLOUDINARY_API_SECRET**

**Key:** `CLOUDINARY_API_SECRET`

**Value:** (Lấy từ Cloudinary dashboard → Settings → Product Environment Credentials)

---

#### ⚙️ Biến môi trường tùy chọn:

##### 7. **NODE_ENV** (Khuyến nghị)

**Key:** `NODE_ENV`

**Value:** `production`

**Lưu ý:** Render tự động set PORT, không cần thêm biến PORT

---

#### ✅ Checklist sau khi thêm xong:

Sau khi thêm tất cả biến môi trường, bạn nên có:

- [ ] `DATABASE_URL` (với password đã thay thế và có `?sslaccept=strict`)
- [ ] `ACCESS_TOKEN_SECRET` (chuỗi ngẫu nhiên dài)
- [ ] `REFRESH_TOKEN_SECRET` (chuỗi ngẫu nhiên khác)
- [ ] `CLOUDINARY_CLOUD_NAME` (nếu dùng Cloudinary)
- [ ] `CLOUDINARY_API_KEY` (nếu dùng Cloudinary)
- [ ] `CLOUDINARY_API_SECRET` (nếu dùng Cloudinary)
- [ ] `NODE_ENV` = `production` (khuyến nghị)

**⚠️ Lưu ý quan trọng:**
- Sau khi thêm/sửa environment variables, Render sẽ tự động **redeploy** service
- Đảm bảo không có khoảng trắng thừa ở đầu/cuối giá trị
- Không để dấu ngoặc kép `"` trong Value (Render tự động xử lý)
- Các giá trị nhạy cảm sẽ được ẩn trong logs (hiển thị dạng `***`)

#### 💡 Mẹo và Lưu ý:

1. **Xem lại tất cả biến:**
   - Scroll xuống để xem tất cả biến đã thêm
   - Có thể edit bằng cách click vào biến đó
   - Có thể xóa bằng nút "Delete" hoặc icon thùng rác

2. **Kiểm tra format:**
   - DATABASE_URL phải bắt đầu bằng `mysql://`
   - DATABASE_URL phải kết thúc bằng `?sslaccept=strict`
   - Các SECRET phải là chuỗi dài (khoảng 128 ký tự)

3. **Nếu quên password TiDB:**
   - Vào TiDB Cloud dashboard
   - Reset password trong phần Database Access
   - Tạo connection string mới

4. **Test connection string:**
   - Có thể test DATABASE_URL bằng cách chạy local:
     ```bash
     cd backend
     # Tạo file .env với DATABASE_URL
     npm run dev
     ```
   - Nếu kết nối thành công → URL đúng ✅

---

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

### ❌ Lỗi: "Exited with status 1 while building your code"

Đây là lỗi build failed. Kiểm tra các nguyên nhân sau:

#### 1. **Lỗi ES Modules (import/export)**
**Triệu chứng:** `SyntaxError: Cannot use import statement outside a module`

**Giải pháp:**
- ✅ Đảm bảo `package.json` có `"type": "module"`
- Đã được fix trong code mới nhất

#### 2. **Lỗi Prisma không tìm thấy**
**Triệu chứng:** `Command 'prisma' not found` hoặc `Cannot find module 'prisma'`

**Giải pháp:**
- ✅ Đảm bảo `prisma` nằm trong `dependencies` (không phải `devDependencies`)
- Đã được fix trong code mới nhất
- Nếu vẫn lỗi, thử build command: `npm install --production=false && npx prisma generate`

#### 3. **Lỗi Prisma Migration Failed**
**Triệu chứng:** `Error: P1001: Can't reach database server` hoặc migration errors

**Giải pháp:**
- ✅ **QUAN TRỌNG**: Phải set `DATABASE_URL` trong Environment Variables TRƯỚC KHI deploy
- Kiểm tra DATABASE_URL có đúng format và có `?sslaccept=strict` không
- Đảm bảo database `qr_ordering` đã được tạo trên TiDB
- Kiểm tra password đã được thay thế (không còn `<PASSWORD>`)
- Nếu migration vẫn fail, có thể tạm thời bỏ `&& npx prisma migrate deploy` khỏi build command và chạy migration thủ công sau

#### 4. **Lỗi Node Version**
**Triệu chứng:** Version không tương thích

**Giải pháp:**
- ✅ Đã thêm `"engines": { "node": ">=18.0.0" }` vào package.json
- Render sẽ tự động dùng Node 18+

#### 5. **Cách xem logs chi tiết:**
1. Vào Render Dashboard → Service của bạn
2. Click tab **"Logs"**
3. Scroll xuống để xem build logs
4. Tìm dòng có chữ **"error"** hoặc **"Error"** (màu đỏ)
5. Copy lỗi cụ thể để debug

#### 6. **Các bước debug:**
```bash
# 1. Kiểm tra DATABASE_URL đã được set chưa
# Vào Environment tab → Kiểm tra có DATABASE_URL không

# 2. Test build command local:
cd backend
npm install
npx prisma generate
npx prisma migrate deploy

# 3. Nếu lỗi ở bước nào, đó là nguyên nhân
```

---

### Lỗi: "Cannot connect to database"
- Kiểm tra DATABASE_URL có đúng format không
- Đảm bảo TiDB cho phép kết nối từ IP của Render (có thể cần whitelist IP)
- Kiểm tra SSL settings trong connection string
- Xem phần "TiDB Connection" bên dưới

### Lỗi: "Prisma migration failed"
- Đảm bảo database đã được tạo sẵn trên TiDB
- Kiểm tra quyền của user database có đủ để tạo bảng không
- Xem logs trong Render dashboard để biết lỗi cụ thể
- **QUAN TRỌNG**: DATABASE_URL phải được set TRƯỚC KHI build

### Lỗi: "Module not found"
- Kiểm tra `package.json` có đầy đủ dependencies không
- Đảm bảo build command chạy `npm install` trước
- Kiểm tra `"type": "module"` đã có trong package.json chưa

### Service bị sleep (Free plan)
- Render free plan sẽ sleep sau 15 phút không có traffic
- Request đầu tiên sau khi sleep sẽ mất 30-60 giây để wake up
- Để tránh sleep, có thể dùng cron job hoặc upgrade lên paid plan

---

## ✅ Checklist trước khi Deploy lại (sau khi fix lỗi)

Sau khi đã fix các vấn đề trên, làm theo checklist này:

### 1. Kiểm tra Code đã được fix:
- [ ] `backend/package.json` có `"type": "module"`
- [ ] `prisma` nằm trong `dependencies` (không phải `devDependencies`)
- [ ] `package.json` có `"engines": { "node": ">=18.0.0" }`

### 2. Commit và Push code mới:
```bash
git add .
git commit -m "Fix: Add ES modules support and move prisma to dependencies"
git push origin master
```

### 3. Kiểm tra Environment Variables trong Render:
- [ ] `DATABASE_URL` đã được set (với password thật, không còn `<PASSWORD>`)
- [ ] `DATABASE_URL` có `?sslaccept=strict` ở cuối
- [ ] `ACCESS_TOKEN_SECRET` đã được set
- [ ] `REFRESH_TOKEN_SECRET` đã được set

### 4. Deploy lại:
- [ ] Vào Render Dashboard → Service của bạn
- [ ] Click **"Manual Deploy"** → **"Deploy latest commit"**
- [ ] Hoặc Render sẽ tự động deploy nếu đã bật auto-deploy
- [ ] Xem logs để đảm bảo build thành công

### 5. Nếu vẫn lỗi:
- [ ] Xem logs chi tiết trong Render Dashboard → Logs tab
- [ ] Copy lỗi cụ thể
- [ ] Kiểm tra lại DATABASE_URL có kết nối được không (test local)

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

