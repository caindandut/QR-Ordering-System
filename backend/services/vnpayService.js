import crypto from 'crypto';
import querystring from 'querystring';
import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat, HashAlgorithm } from 'vnpay';

const vnp_TmnCode = process.env.VNP_TMN_CODE || '';
const vnp_HashSecret = process.env.VNP_HASH_SECRET || '';

const vnp_Host = process.env.VNP_HOST || 'https://sandbox.vnpayment.vn';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const vnp_ReturnUrl = process.env.VNP_RETURN_URL || `${backendUrl}/api/payments/callback`;

export async function createPaymentUrl({
  amount,
  orderId,
  orderInfo = 'Thanh toan don hang',
  orderType = 'other',
  locale = 'vn',
  ipAddr = '127.0.0.1',
}) {
  const normalizedAmount = Math.max(0, Math.floor(Number(amount) || 0));

  const vnpay = new VNPay({
    tmnCode: vnp_TmnCode,
    secureSecret: vnp_HashSecret,
    vnpayHost: vnp_Host,
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    loggerFn: ignoreLogger,
  });

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  console.log('Creating VNPay payment URL with ReturnUrl:', vnp_ReturnUrl);
  
  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: normalizedAmount,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_TxnRef: orderId.toString(),
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: vnp_ReturnUrl,
    vnp_Locale: locale === 'vn' ? VnpLocale.VN : VnpLocale.EN,
    vnp_CreateDate: dateFormat(now),
    vnp_ExpireDate: dateFormat(tomorrow),
  });

  console.log('VNPay payment URL created:', vnpayResponse);
  return vnpayResponse;
}

export function verifySecureHash(vnp_Params) {
  const vnpay = new VNPay({
    tmnCode: vnp_TmnCode,
    secureSecret: vnp_HashSecret,
    vnpayHost: vnp_Host,
    testMode: true,
    hashAlgorithm: HashAlgorithm.SHA512,
    loggerFn: ignoreLogger,
  });

  const result = vnpay.verifyReturnUrl(vnp_Params);
  console.log('VNPay verifyReturnUrl result:', result);

  return result.isVerified;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function getIpAddress(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}
