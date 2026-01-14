import express from 'express';
import { prisma, io } from '../index.js';
import { createPaymentUrl, verifySecureHash, getIpAddress } from '../services/vnpayService.js';

// VNPay có thể gửi callback qua cả GET và POST
const router = express.Router();

/**
 * Render trang HTML thông báo thanh toán thành công
 */
function renderSuccessPage({ orderId, amount, transactionNo, bankCode, payDate, redirectUrl }) {
  const formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
  const formattedDate = payDate && payDate.length === 14 
    ? `${payDate.slice(6, 8)}/${payDate.slice(4, 6)}/${payDate.slice(0, 4)} ${payDate.slice(8, 10)}:${payDate.slice(10, 12)}:${payDate.slice(12, 14)}`
    : payDate;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh toán thành công - VNPay</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .success-icon {
            width: 100px;
            height: 100px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .success-icon::after {
            content: '✓';
            color: white;
            font-size: 60px;
            font-weight: bold;
        }
        h1 {
            color: #10b981;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .info-box {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #6b7280;
            font-size: 14px;
        }
        .info-value {
            color: #111827;
            font-size: 14px;
            font-weight: 600;
        }
        .amount {
            color: #10b981;
            font-size: 24px;
            font-weight: 700;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        .button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .button-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        .button-secondary:hover {
            background: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon"></div>
        <h1>Thanh toán thành công!</h1>
        <p class="subtitle">Giao dịch của bạn đã được xử lý thành công</p>
        
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Mã đơn hàng:</span>
                <span class="info-value">#${orderId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Số tiền:</span>
                <span class="info-value amount">${formattedAmount} đ</span>
            </div>
            <div class="info-row">
                <span class="info-label">Mã giao dịch:</span>
                <span class="info-value">${transactionNo}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Ngân hàng:</span>
                <span class="info-value">${bankCode}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Thời gian:</span>
                <span class="info-value">${formattedDate}</span>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="button" onclick="window.location.href='${redirectUrl}'">Xem đơn hàng</button>
            <button class="button button-secondary" onclick="window.close()">Đóng cửa sổ</button>
        </div>
        <script>
            // Tự động redirect sau 3 giây nếu người dùng không click
            setTimeout(function() {
                window.location.href = '${redirectUrl}';
            }, 3000);
        </script>

        <div class="footer">
            Cảm ơn bạn đã sử dụng dịch vụ thanh toán VNPay
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Render trang HTML thông báo thanh toán thất bại
 */
function renderFailedPage({ orderId, responseCode, redirectUrl }) {
  const errorMessages = {
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
    '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
    '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
    '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Nhập sai mật khẩu đăng nhập InternetBanking quá số lần quy định.',
    '99': 'Lỗi không xác định được. Vui lòng liên hệ hotline để được hỗ trợ.',
  };
  const errorMessage = errorMessages[responseCode] || 'Giao dịch thanh toán không thành công. Vui lòng thử lại.';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh toán thất bại - VNPay</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .error-icon {
            width: 100px;
            height: 100px;
            background: #ef4444;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .error-icon::after {
            content: '✕';
            color: white;
            font-size: 60px;
            font-weight: bold;
        }
        h1 {
            color: #ef4444;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .error-box {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            text-align: left;
        }
        .error-code {
            color: #991b1b;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .error-message {
            color: #7f1d1d;
            font-size: 14px;
            line-height: 1.6;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #6b7280;
            font-size: 14px;
        }
        .info-value {
            color: #111827;
            font-size: 14px;
            font-weight: 600;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #ef4444;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        .button:hover {
            background: #dc2626;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(239, 68, 68, 0.3);
        }
        .button-secondary {
            background: white;
            color: #ef4444;
            border: 2px solid #ef4444;
        }
        .button-secondary:hover {
            background: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon"></div>
        <h1>Thanh toán thất bại</h1>
        <p class="subtitle">Giao dịch của bạn không thể được xử lý</p>
        
        <div class="error-box">
            <div class="error-code">Mã lỗi: ${responseCode}</div>
            <div class="error-message">${errorMessage}</div>
        </div>

        <div class="info-box" style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <div class="info-row">
                <span class="info-label">Mã đơn hàng:</span>
                <span class="info-value">#${orderId}</span>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="button" onclick="window.location.href='${redirectUrl}'">Thử lại</button>
            <button class="button button-secondary" onclick="window.close()">Đóng cửa sổ</button>
        </div>

        <div class="footer">
            Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * Render trang HTML thông báo lỗi
 */
function renderErrorPage({ message, redirectUrl }) {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lỗi xử lý thanh toán - VNPay</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            padding: 40px;
            text-align: center;
            animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .warning-icon {
            width: 100px;
            height: 100px;
            background: #f59e0b;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            animation: scaleIn 0.5s ease-out 0.2s both;
        }
        @keyframes scaleIn {
            from {
                transform: scale(0);
            }
            to {
                transform: scale(1);
            }
        }
        .warning-icon::after {
            content: '⚠';
            color: white;
            font-size: 60px;
            font-weight: bold;
        }
        h1 {
            color: #f59e0b;
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
            margin-bottom: 30px;
        }
        .error-box {
            background: #fffbeb;
            border: 2px solid #fde68a;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .error-message {
            color: #92400e;
            font-size: 14px;
            line-height: 1.6;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background: #f59e0b;
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        .button:hover {
            background: #d97706;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
        }
        .footer {
            margin-top: 30px;
            color: #9ca3af;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="warning-icon"></div>
        <h1>Lỗi xử lý thanh toán</h1>
        <p class="subtitle">Đã xảy ra lỗi trong quá trình xử lý</p>
        
        <div class="error-box">
            <div class="error-message">${message}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="button" onclick="window.location.href='${redirectUrl}'" style="background: white; color: #f59e0b; border: 2px solid #f59e0b;">Về trang đơn hàng</button>
            <button class="button button-secondary" onclick="window.close()">Đóng cửa sổ</button>
        </div>

        <div class="footer">
            Vui lòng liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục
        </div>
    </div>
</body>
</html>
  `;
}

/**
 * POST /api/payments/create
 * Tạo payment URL cho đơn hàng
 */
router.post('/create', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ message: 'Thiếu thông tin đơn hàng.' });
  }

  try {
    // Lấy thông tin đơn hàng + chi tiết để tính lại tiền
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      include: {
        table: { select: { name: true } },
        details: {
          include: {
            menuItem: { select: { name: true } }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.status !== 'SERVED') {
      return res.status(400).json({ 
        message: 'Chỉ có thể thanh toán cho đơn hàng đã được phục vụ.' 
      });
    }

    // Kiểm tra đã thanh toán chưa
    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ 
        message: 'Đơn hàng này đã được thanh toán.' 
      });
    }

    // Tính lại tổng tiền từ chi tiết đơn hàng để đảm bảo chính xác
    const recalculatedTotal = order.details.reduce(
      (sum, detail) => sum + detail.quantity * detail.priceAtOrder,
      0
    );

    // Nếu totalAmount trong DB khác với tổng tính lại thì đồng bộ lại
    let finalTotalAmount = recalculatedTotal;
    if (order.totalAmount !== recalculatedTotal) {
      await prisma.order.update({
        where: { id: order.id },
        data: { totalAmount: recalculatedTotal },
      });
    }

    // Tạo mã giao dịch duy nhất (vnpTxnRef) - chỉ dùng số để tránh lỗi format
    const vnpTxnRef = `${order.id}${Date.now()}`;

    // Tạo payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        vnpTxnRef: vnpTxnRef,
        vnpAmount: finalTotalAmount,
        paymentStatus: 'PENDING',
      }
    });

    // Tạo mô tả đơn hàng
    const orderInfo = `Thanh toan don hang #${order.id} - Ban ${order.table.name}`;

    // Lấy IP address của khách hàng
    const ipAddr = getIpAddress(req);

    // Tạo payment URL với đúng số tiền món ăn đã gọi
    const paymentUrl = await createPaymentUrl({
      amount: finalTotalAmount,
      orderId: vnpTxnRef,
      orderInfo: orderInfo,
      orderType: 'other',
      locale: 'vn',
      ipAddr: ipAddr,
    });

    res.status(200).json({
      paymentUrl,
      paymentId: payment.id,
      vnpTxnRef: vnpTxnRef,
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

/**
 * Callback handler - xử lý callback từ VNPay sau khi thanh toán
 * VNPay có thể gửi callback qua GET hoặc POST
 */
const handleCallback = async (req, res) => {
  // Clone params để tránh sửa trực tiếp req.query
  const vnp_Params = { ...req.query };

  // Debug: Log để kiểm tra
  console.log('VNPay Callback Params:', JSON.stringify(vnp_Params, null, 2));

  // Xác thực chữ ký bằng thư viện vnpay (verifyReturnUrl)
  const isValid = verifySecureHash(vnp_Params);

  if (!isValid) {
    console.error('Chữ ký không hợp lệ. SecureHash từ VNPay:', vnp_Params['vnp_SecureHash']);
    return res.status(400).json({ message: 'Chữ ký không hợp lệ.' });
  }

  const secureHash = vnp_Params['vnp_SecureHash'];
  const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
  const vnp_TxnRef = vnp_Params['vnp_TxnRef'];
  const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
  const vnp_Amount = parseInt(vnp_Params['vnp_Amount'], 10) / 100; // Chia 100 vì VNPay nhân 100

  try {
    // Tìm payment record
    const payment = await prisma.payment.findUnique({
      where: { vnpTxnRef: vnp_TxnRef },
      include: { order: true }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch thanh toán.' });
    }

    // Kiểm tra số tiền
    if (vnp_Amount !== payment.vnpAmount) {
      return res.status(400).json({ message: 'Số tiền thanh toán không khớp.' });
    }

    // Xử lý kết quả thanh toán
    if (vnp_ResponseCode === '00') {
      // Thanh toán thành công
      await prisma.$transaction(async (tx) => {
        // Cập nhật payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            vnpTransactionNo: vnp_TransactionNo,
            vnpResponseCode: vnp_ResponseCode,
            vnpSecureHash: secureHash,
            paymentStatus: 'SUCCESS',
          }
        });

        // Cập nhật order
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: 'PAID',
            status: 'PAID',
          }
        });
      });

      // Emit socket event
      io.to(`order_${payment.orderId}`).emit('order_status_updated', {
        orderId: payment.orderId,
        newStatus: 'PAID',
      });

      io.emit('order_updated_for_admin', {
        id: payment.orderId,
        status: 'PAID',
        paymentStatus: 'PAID',
      });

      // Redirect 302 thẳng về trang success của customer app
      console.log('✅ Payment successful, redirecting to customer success page for order:', payment.orderId);
      const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
      const redirectUrl = `${customerAppUrl}/payment/success?orderId=${payment.orderId}`;
      return res.redirect(302, redirectUrl);
    } else {
      // Thanh toán thất bại
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          vnpTransactionNo: vnp_TransactionNo,
          vnpResponseCode: vnp_ResponseCode,
          vnpSecureHash: secureHash,
          paymentStatus: 'FAILED',
        }
      });

      // Redirect 302 thẳng về trang failed của customer app
      const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
      const redirectUrl = `${customerAppUrl}/payment/failed?orderId=${payment.orderId}&code=${vnp_ResponseCode}`;
      return res.redirect(302, redirectUrl);
    }

  } catch (error) {
    console.error('Error processing payment callback:', error);
    const customerAppUrl = process.env.CUSTOMER_APP_URL || 'http://localhost:5174';
    const redirectUrl = `${customerAppUrl}/payment/error`;

    // Redirect 302 thẳng về trang error của customer app
    return res.redirect(302, redirectUrl);
  }
};

// VNPay có thể gửi callback qua cả GET và POST
router.get('/callback', handleCallback);
router.post('/callback', handleCallback);

/**
 * GET /api/payments/:orderId/status
 * Kiểm tra trạng thái thanh toán của đơn hàng
 */
router.get('/:orderId/status', async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: {
            menuItem: {
              select: { name: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Lấy payment mới nhất
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    }

    res.status(200).json({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      totalAmount: order.totalAmount,
      items: order.details.map((detail) => ({
        id: detail.id,
        name: detail.menuItem?.name || 'Món ăn',
        quantity: detail.quantity,
        price: detail.priceAtOrder,
      })),
      latestPayment: order.payments[0] || null,
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

export default router;

