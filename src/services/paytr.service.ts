import crypto from "crypto";

const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID!;
const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY!;
const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT!;
const TEST_MODE = process.env.PAYTR_TEST_MODE || "1";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

interface PaytrTokenParams {
  merchantOid: string;
  email: string;
  paymentAmount: number; // kuruş cinsinden (TL * 100)
  userName: string;
  userAddress: string;
  userPhone: string;
  userIp: string;
  userBasket: Array<[string, string, number]>; // [name, price, quantity]
}

export async function createPaytrToken(params: PaytrTokenParams): Promise<{ token: string } | { error: string }> {
  const {
    merchantOid, email, paymentAmount,
    userName, userAddress, userPhone, userIp, userBasket,
  } = params;

  const userBasketStr = Buffer.from(JSON.stringify(userBasket)).toString("base64");
  const noInstallment = "1";
  const maxInstallment = "0";
  const currency = "TL";

  const hashStr =
    MERCHANT_ID + userIp + merchantOid + email +
    paymentAmount.toString() + userBasketStr +
    noInstallment + maxInstallment + currency + TEST_MODE;

  const paytrToken = crypto
    .createHmac("sha256", MERCHANT_KEY)
    .update(hashStr + MERCHANT_SALT)
    .digest("base64");

  const formData = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: paymentAmount.toString(),
    paytr_token: paytrToken,
    user_basket: userBasketStr,
    debug_on: "1",
    no_installment: noInstallment,
    max_installment: maxInstallment,
    currency,
    test_mode: TEST_MODE,
    merchant_ok_url: `${BASE_URL}/odeme/basarili`,
    merchant_fail_url: `${BASE_URL}/odeme?hata=odeme-basarisiz`,
    user_name: userName,
    user_address: userAddress,
    user_phone: userPhone,
    timeout_limit: "30",
    lang: "tr",
  });

  const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();

  if (result.status === "success") {
    return { token: result.token };
  }
  return { error: result.reason || "PayTR token alınamadı" };
}

export function verifyPaytrCallback(params: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}): boolean {
  const { merchantOid, status, totalAmount, hash } = params;

  const expectedHash = crypto
    .createHmac("sha256", MERCHANT_KEY)
    .update(merchantOid + MERCHANT_SALT + status + totalAmount)
    .digest("base64");

  return hash === expectedHash;
}
