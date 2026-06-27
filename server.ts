import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parser for POST requests
app.use(express.json());

// API: Send email using Gmail SMTP / Brevo REST API / custom settings
app.post("/api/send-email", async (req, res) => {
  const { 
    to, 
    buyerName, 
    transactionId, 
    paymentMethod, 
    totalPrice, 
    items, 
    paymentStatus, 
    smtpConfig, 
    emailService, 
    brevoApiKey, 
    brevoSenderName, 
    brevoSenderEmail 
  } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, error: "Alamat email penerima ('to') wajib diisi!" });
  }

  const activeEmailService = emailService || (process.env.BREVO_API_KEY ? "brevo" : "smtp");
  const activeBrevoApiKey = brevoApiKey || process.env.BREVO_API_KEY;
  const activeBrevoSenderEmail = brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || "no-reply@digimarket.com";
  const activeBrevoSenderName = brevoSenderName || process.env.BREVO_SENDER_NAME || "DigiMarket System";

  let transporter: any;
  let fromEmail = "no-reply@digimarket.com";
  let usingCustomSMTP = false;

  try {
    if (activeEmailService === "smtp") {
      if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
        usingCustomSMTP = true;
        const portNum = parseInt(smtpConfig.port, 10) || (smtpConfig.secure ? 465 : 587);
        transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: portNum,
          secure: smtpConfig.secure !== undefined ? smtpConfig.secure : (portNum === 465),
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
          },
        });
        fromEmail = smtpConfig.user;
      } else {
        const gmailUser = process.env.GMAIL_USER;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailAppPassword) {
          return res.status(400).json({
            success: false,
            error: "Fitur pengiriman email belum aktif karena SMTP belum dikonfigurasi di Setingan Toko (oleh Admin) maupun di server (GMAIL_USER & GMAIL_APP_PASSWORD).\n\n" +
                   "Silakan masuk ke Admin Dashboard -> Setingan Toko untuk mengisi konfigurasi SMTP Server Anda sendiri."
          });
        }

        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
        });
        fromEmail = gmailUser;
      }
    } else if (activeEmailService === "brevo") {
      if (!activeBrevoApiKey) {
        return res.status(400).json({
          success: false,
          error: "Fitur pengiriman email belum aktif karena API Key Brevo belum dikonfigurasi di Setingan Toko maupun di server (BREVO_API_KEY)."
        });
      }
    }

    const isPending = !paymentStatus || paymentStatus === "PENDING" || paymentStatus === "VERIFYING" || paymentStatus !== "SUCCESS";

    // Build items HTML list
    const itemsListHtml = items && Array.isArray(items) 
      ? items.map((item: any) => {
          const displayLicense = isPending ? "***" : (item.licenseKey || "Tanpa Lisensi");
          const displayPassword = isPending ? "***" : (item.decryptPassword ? `Password: ${item.decryptPassword}` : "-");
          return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; font-weight: bold; color: #1e293b;">${item.productName}</td>
            <td style="padding: 12px; font-family: monospace; font-size: 13px; color: #0369a1; background-color: #f0f9ff; border-radius: 4px; padding: 4px 8px;">
              ${displayLicense}
            </td>
            <td style="padding: 12px; font-family: monospace; font-size: 11px; color: #64748b;">
              ${displayPassword}
            </td>
          </tr>
        `;
        }).join("")
      : "<tr><td colspan='3' style='padding: 12px; text-align: center; color: #64748b;'>Tidak ada detail produk</td></tr>";

    const formattedPrice = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(totalPrice || 0);

    const statusTextHtml = isPending 
      ? `berstatus <strong style="color: #d97706;">${paymentStatus === "VERIFYING" ? "SEDANG DIVERIFIKASI" : "MENUNGGU PEMBAYARAN"}</strong>. Lisensi digital dan password dekripsi Anda saat ini masih terkunci, dan akan aktif setelah pembayaran dikonfirmasi LUNAS oleh Administrator.`
      : `telah kami terima dan <strong style="color: #16a34a;">LUNAS</strong> terverifikasi.`;

    const emailSubject = `🚀 Lisensi & Invoice Digital: ${transactionId || "Sukses"}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">DigiMarket</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #94a3b8; font-weight: 500;">Kwitansi Pembayaran & Pengiriman Digital Instan</p>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px;">
            <h2 style="margin-top: 0; font-size: 18px; font-weight: 700; color: #0f172a;">Halo, ${buyerName || "Pelanggan Setia"}! 👋</h2>
            <p style="color: #475569; font-size: 14px;">Terima kasih atas pesanan Anda. Pembayaran Anda sebesar <strong style="color: #0f172a;">${formattedPrice}</strong> melalui metode <strong style="color: #0f172a;">${paymentMethod || "Metode Aman"}</strong> ${statusTextHtml}</p>
            
            <!-- Invoice Details Card -->
            <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">ID Transaksi</td>
                  <td style="font-family: monospace; font-weight: bold; text-align: right; color: #0f172a; padding-bottom: 8px;">${transactionId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Email Pembeli</td>
                  <td style="font-weight: 500; text-align: right; color: #0f172a; padding-bottom: 8px;">${to}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 8px;">Waktu Transaksi</td>
                  <td style="font-weight: 500; text-align: right; color: #0f172a; padding-bottom: 8px;">${new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} WIB</td>
                </tr>
                <tr style="border-top: 1px solid #cbd5e1;">
                  <td style="color: #64748b; padding-top: 10px; font-weight: bold;">TOTAL BAYAR</td>
                  <td style="font-size: 16px; font-weight: 800; text-align: right; color: #0284c7; padding-top: 10px;">${formattedPrice}</td>
                </tr>
              </table>
            </div>

            <!-- Products & Licenses Table -->
            <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">📦 Item Digital & Lisensi Anda:</h3>
            <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 12px; font-weight: bold; color: #475569;">Nama Produk</th>
                    <th style="padding: 12px; font-weight: bold; color: #475569;">Kode Lisensi</th>
                    <th style="padding: 12px; font-weight: bold; color: #475569;">Info Tambahan</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsListHtml}
                </tbody>
              </table>
            </div>

            <!-- Brankas Digital Link -->
            <div style="text-align: center; margin: 32px 0 16px 0;">
              <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Anda juga dapat mengunduh file produk dan mengelola semua lisensi yang telah dibeli di Brankas Digital:</p>
              <a href="${process.env.APP_URL || "http://localhost:3000"}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: bold; transition: background-color 0.2s; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);">🔓 Buka Brankas Digital</a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;">Email ini dikirim secara otomatis oleh DigiMarket System. Jangan membalas email ini.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} DigiMarket. Hak Cipta Dilindungi Undang-Undang.</p>
          </div>

        </div>
      </div>
    `;

    if (activeEmailService === "brevo") {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": activeBrevoApiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: activeBrevoSenderName,
            email: activeBrevoSenderEmail
          },
          to: [
            {
              email: to,
              name: buyerName || "Pelanggan"
            }
          ],
          subject: emailSubject,
          htmlContent: emailHtml
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo REST API Error (${response.status}): ${errorText}`);
      }
    } else {
      await transporter.sendMail({
        from: `"DigiMarket System" <${fromEmail}>`,
        to: to,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    return res.status(200).json({ success: true, message: `Email sukses terkirim ke ${to} (via ${activeEmailService.toUpperCase()})` });
  } catch (err: any) {
    console.error("Gagal mengirim email:", err);
    const errorMessage = err?.message || String(err);
    
    if (activeEmailService === "smtp" && !usingCustomSMTP && (errorMessage.includes("535") || errorMessage.toLowerCase().includes("username and password not accepted"))) {
      return res.status(500).json({
        success: false,
        error: `🔐 Gagal Autentikasi SMTP Gmail (Error 535)\n\n` +
               `Detail Error: ${errorMessage}\n\n` +
               `⚠️ Masalah ini terjadi karena Anda menggunakan password akun Gmail utama Anda, atau App Password yang Anda masukkan tidak valid.\n\n` +
               `Langkah-langkah untuk menyelesaikan:\n` +
               `1. Pastikan Anda telah mengaktifkan 'Verifikasi 2 Langkah' (2-Step Verification) di Akun Google Anda.\n` +
               `2. Masuk ke Google Account -> Keamanan -> Verifikasi 2 Langkah -> Sandi Aplikasi (App Passwords) di bagian paling bawah.\n` +
               `3. Buat Sandi Aplikasi baru (misalnya diberi nama 'DigiMarket'). Google akan memberikan sandi 16 digit yang unik.\n` +
               `4. Buka menu 'Settings' di panel kanan atas Google AI Studio.\n` +
               `5. Di bagian 'Environment Secrets', update GMAIL_APP_PASSWORD dengan menyalin 16 digit sandi tersebut (tanpa spasi).\n` +
               `6. Kirim ulang email ini.`
      });
    }

    return res.status(500).json({
      success: false,
      error: `Gagal mengirim email via ${activeEmailService.toUpperCase()}: ${errorMessage}.\n\n` +
             (activeEmailService === "brevo"
               ? "Silakan periksa kembali API Key Brevo yang Anda masukkan di Setingan Toko atau file environment."
               : (usingCustomSMTP 
                 ? "Silakan periksa kembali konfigurasi SMTP (Host, Port, User, Password, Secure) yang Anda masukkan di Setingan Toko." 
                 : "Pastikan konfigurasi SMTP di panel Settings AI Studio sudah sesuai."))
    });
  }
});

// API: Send email notification to Admin for new orders
app.post("/api/send-admin-notification", async (req, res) => {
  const { 
    adminEmail, 
    adminName, 
    buyerName, 
    buyerEmail, 
    buyerPhone, 
    transactionId, 
    paymentMethod, 
    totalPrice, 
    items,
    smtpConfig, 
    emailService, 
    brevoApiKey, 
    brevoSenderName, 
    brevoSenderEmail 
  } = req.body;

  if (!adminEmail) {
    return res.status(400).json({ success: false, error: "Alamat email administrator ('adminEmail') wajib diisi!" });
  }

  const activeEmailService = emailService || (process.env.BREVO_API_KEY ? "brevo" : "smtp");
  const activeBrevoApiKey = brevoApiKey || process.env.BREVO_API_KEY;
  const activeBrevoSenderEmail = brevoSenderEmail || process.env.BREVO_SENDER_EMAIL || "no-reply@digimarket.com";
  const activeBrevoSenderName = brevoSenderName || process.env.BREVO_SENDER_NAME || "DigiMarket System";

  let transporter: any;
  let fromEmail = "no-reply@digimarket.com";
  let usingCustomSMTP = false;

  try {
    if (activeEmailService === "smtp") {
      if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.password) {
        usingCustomSMTP = true;
        const portNum = parseInt(smtpConfig.port, 10) || (smtpConfig.secure ? 465 : 587);
        transporter = nodemailer.createTransport({
          host: smtpConfig.host,
          port: portNum,
          secure: smtpConfig.secure !== undefined ? smtpConfig.secure : (portNum === 465),
          auth: {
            user: smtpConfig.user,
            pass: smtpConfig.password,
          },
        });
        fromEmail = smtpConfig.user;
      } else {
        const gmailUser = process.env.GMAIL_USER;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailAppPassword) {
          return res.status(400).json({
            success: false,
            error: "Fitur pengiriman email admin belum aktif karena SMTP Gmail belum dikonfigurasi di server."
          });
        }

        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: gmailAppPassword,
          },
        });
        fromEmail = gmailUser;
      }
    } else if (activeEmailService === "brevo") {
      if (!activeBrevoApiKey) {
        return res.status(400).json({
          success: false,
          error: "Fitur pengiriman email belum aktif karena API Key Brevo belum dikonfigurasi."
        });
      }
    }

    const itemsListHtml = items && Array.isArray(items) 
      ? items.map((item: any) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: bold; color: #1e293b; font-size: 13px;">${item.productName}</td>
            <td style="padding: 10px; font-family: monospace; font-size: 11px; color: #64748b; text-align: right;">x${item.quantity || 1}</td>
          </tr>
        `).join("")
      : "<tr><td colspan='2' style='padding: 10px; text-align: center; color: #64748b;'>Tidak ada detail produk</td></tr>";

    const formattedPrice = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(totalPrice || 0);

    const emailSubject = `🔔 [ORDER BARU] ${transactionId || "Sukses"} - Rp ${totalPrice?.toLocaleString('id-ID') || 0}`;
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 20px; color: #334155; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <div style="background-color: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
            <span style="background-color: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Admin Notification</span>
            <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.015em;">🔔 PESANAN BARU MASUK</h1>
          </div>

          <!-- Content Body -->
          <div style="padding: 32px;">
            <p style="margin-top: 0; font-size: 14px; color: #475569;">Halo, <strong style="color: #0f172a;">${adminName || "Administrator"}</strong>!</p>
            <p style="font-size: 14px; color: #475569;">Sistem mendeteksi adanya transaksi masuk baru dari pelanggan yang memerlukan perhatian Anda.</p>
            
            <!-- Transaction Summary -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Detail Transaksi:</h3>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">ID Transaksi</td>
                  <td style="font-family: monospace; font-weight: bold; text-align: right; color: #0284c7; padding-bottom: 6px;">${transactionId || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Nama Pembeli</td>
                  <td style="font-weight: bold; text-align: right; color: #0f172a; padding-bottom: 6px;">${buyerName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Email Pembeli</td>
                  <td style="font-weight: 500; text-align: right; color: #0f172a; padding-bottom: 6px;">${buyerEmail || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Telepon</td>
                  <td style="font-weight: 500; text-align: right; color: #0f172a; padding-bottom: 6px;">${buyerPhone || "N/A"}</td>
                </tr>
                <tr>
                  <td style="color: #64748b; padding-bottom: 6px;">Metode Pembayaran</td>
                  <td style="font-weight: bold; text-align: right; color: #0f172a; padding-bottom: 6px;">${paymentMethod || "N/A"}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="color: #475569; padding-top: 10px; font-weight: bold;">TOTAL BAYAR</td>
                  <td style="font-size: 15px; font-weight: 800; text-align: right; color: #e11d48; padding-top: 10px;">${formattedPrice}</td>
                </tr>
              </table>
            </div>

            <!-- Items Purchased -->
            <h4 style="font-size: 12px; font-weight: bold; color: #0f172a; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">📦 Produk Yang Dipesan:</h4>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <tbody style="divide-y divide-slate-100">
                  ${itemsListHtml}
                </tbody>
              </table>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 24px 0 8px 0;">
              <a href="${process.env.APP_URL || "http://localhost:3000"}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: bold; box-shadow: 0 2px 4px rgba(15, 23, 42, 0.2);">🔓 Buka Dashboard Admin</a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">Sistem Otomatisasi Notifikasi Admin DigiMarket</p>
          </div>
        </div>
      </div>
    `;

    if (activeEmailService === "brevo") {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": activeBrevoApiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: activeBrevoSenderName,
            email: activeBrevoSenderEmail
          },
          to: [
            {
              email: adminEmail,
              name: adminName || "Administrator"
            }
          ],
          subject: emailSubject,
          htmlContent: emailHtml
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo REST API Error (${response.status}): ${errorText}`);
      }
    } else {
      await transporter.sendMail({
        from: `"DigiMarket System" <${fromEmail}>`,
        to: adminEmail,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    return res.status(200).json({ success: true, message: `Email notifikasi pesanan dikirim ke Admin ${adminEmail} (via ${activeEmailService.toUpperCase()})` });
  } catch (err: any) {
    console.error("Gagal mengirim email notifikasi ke admin:", err);
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Endpoint to generate GitHub OAuth URL
app.get("/api/auth/github-url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      error: "Fitur login GitHub belum aktif karena GITHUB_CLIENT_ID belum dikonfigurasi di server.\n\n" +
             "Cara Mengaktifkan:\n" +
             "1. Buka https://github.com/settings/developers dan buat OAuth App baru.\n" +
             "2. Atur 'Homepage URL' ke URL aplikasi Anda.\n" +
             "3. Atur 'Authorization callback URL' ke: <URL_Aplikasi_Anda>/auth/callback\n" +
             "4. Salin Client ID dan Client Secret yang dihasilkan.\n" +
             "5. Buka menu 'Settings' di Google AI Studio -> Environment Secrets, lalu tambahkan:\n" +
             "   - GITHUB_CLIENT_ID: Client ID dari GitHub\n" +
             "   - GITHUB_CLIENT_SECRET: Client Secret dari GitHub"
    });
  }

  const appUrl = process.env.APP_URL ? process.env.APP_URL.replace(/\/$/, "") : "";
  const redirectUri = appUrl 
    ? `${appUrl}/auth/callback` 
    : `${req.protocol}://${req.get("host")}/auth/callback`;

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  return res.status(200).json({ success: true, url: authUrl });
});

// Callback endpoint for GitHub OAuth
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const code = req.query.code;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send("<h3>Error: Authorization code is missing.</h3>");
  }

  if (!clientId || !clientSecret) {
    return res.status(400).send("<h3>Error: GitHub Client configuration is missing.</h3>");
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to exchange code: ${tokenResponse.statusText}`);
    }

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error(tokenData.error_description || tokenData.error || "Access token not found in response.");
    }

    // 2. Fetch GitHub User Profile
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "User-Agent": "DigiMarket-App",
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user profile: ${userResponse.statusText}`);
    }

    const userData: any = await userResponse.json();

    // 3. Fetch GitHub Emails (in case the primary email is set to private in profile)
    let email = userData.email;
    try {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": "DigiMarket-App",
        },
      });
      if (emailsResponse.ok) {
        const emails: any = await emailsResponse.json();
        const primaryEmail = emails.find((e: any) => e.primary);
        if (primaryEmail) {
          email = primaryEmail.email;
        } else if (emails.length > 0) {
          email = emails[0].email;
        }
      }
    } catch (emailErr) {
      console.warn("Could not fetch secondary emails:", emailErr);
    }

    // Default email fallback if still empty
    if (!email) {
      email = `${userData.login}@users.noreply.github.com`;
    }

    // 4. Send parent window message & close popup
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autentikasi Berhasil</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #f8fafc;
              color: #0f172a;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .spinner {
              border: 3px solid #e2e8f0;
              border-top: 3px solid #0284c7;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              animation: spin 1s linear infinite;
              margin-bottom: 20px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            h3 { margin-bottom: 8px; }
            p { color: #64748b; font-size: 14px; margin-top: 0; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h3>Masuk Sukses!</h3>
          <p>Sedang menghubungkan ke DigiMarket, mohon tunggu...</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({
                  type: "GITHUB_AUTH_SUCCESS",
                  user: {
                    login: ${JSON.stringify(userData.login)},
                    name: ${JSON.stringify(userData.name || userData.login)},
                    email: ${JSON.stringify(email)},
                    avatar_url: ${JSON.stringify(userData.avatar_url)}
                  }
                }, "*");
                setTimeout(() => {
                  window.close();
                }, 800);
              } else {
                window.location.href = "/";
              }
            } catch (err) {
              console.error(err);
              window.location.href = "/";
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error("Error GitHub OAuth callback:", err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autentikasi Gagal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-color: #fef2f2;
              color: #991b1b;
              margin: 0;
              text-align: center;
              padding: 20px;
            }
            .card {
              background: white;
              border: 1px solid #fee2e2;
              padding: 30px;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
              max-width: 400px;
            }
            h3 { color: #991b1b; margin-top: 0; }
            p { color: #7f1d1d; font-size: 14px; }
            button {
              background: #0f172a;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>🔴 Autentikasi Gagal</h3>
            <p>Gagal menukar kode akses atau mengambil data profil GitHub.</p>
            <p style="font-size:12px; opacity:0.8; font-family:monospace;">Detail: ${err.message || String(err)}</p>
            <button onclick="window.close()">Tutup Jendela</button>
          </div>
        </body>
      </html>
    `);
  }
});

// Initialize Gemini client lazily/safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Route for AI Chat Assistant in Complaints
app.post("/api/complaint/chat", async (req, res) => {
  const { messages, transactionContext } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, error: "Messages array is required." });
  }

  // Fallback responses if Gemini is not configured
  const fallbackReplies: { [key: string]: string } = {
    lisensi: "Untuk kendala kunci lisensi (serial key) tidak valid, mohon pastikan kembali format penulisan, tidak menyalin spasi tambahan, dan sesuaikan dengan versi software Anda. Jika tetap gagal, silakan ajukan tiket resmi lewat tab 'Form Pengaduan' agar admin kami dapat memverifikasi dan menggantinya dengan key baru.",
    download: "Jika tautan unduhan (download link) lambat, rusak, atau macet, silakan coba refresh halaman Brankas Digital Anda terlebih dahulu atau gunakan browser alternatif. Jika tautan kadaluarsa, Anda bisa melapor lewat tab 'Form Pengaduan' agar admin meng-generate link download yang baru.",
    bayar: "Verifikasi pembayaran otomatis di DigiMarket biasanya membutuhkan waktu 1-5 menit setelah dana terkirim. Harap pastikan jumlah transfer sesuai persis dengan 3 digit kode unik. Jika status tidak kunjung berubah, kirim bukti transfer melalui formulir pengaduan.",
    password: "Untuk file zip/rar yang terproteksi sandi, Anda bisa mengecek password dekripsi di tabel riwayat transaksi pada Brankas Digital Anda. Biasanya password berupa nama website atau kode unik yang tertera di sana.",
  };

  try {
    const client = getGeminiClient();
    
    if (!client) {
      // Return custom smart mock answers based on keyword matching to maintain an amazing experience
      const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || "";
      let reply = "Halo! Saya adalah Zera, asisten pintar DigiMarket. Mohon maaf saat ini kunci AI (GEMINI_API_KEY) belum terpasang di Environment Secrets, namun saya bisa membantu mendeteksi keluhan Anda. ";
      
      if (userMessage.includes("lisensi") || userMessage.includes("serial") || userMessage.includes("key")) {
        reply += "\n\n" + fallbackReplies.lisensi;
      } else if (userMessage.includes("download") || userMessage.includes("unduh") || userMessage.includes("link")) {
        reply += "\n\n" + fallbackReplies.download;
      } else if (userMessage.includes("bayar") || userMessage.includes("transfer") || userMessage.includes("konfirmasi") || userMessage.includes("uang") || userMessage.includes("rekening")) {
        reply += "\n\n" + fallbackReplies.bayar;
      } else if (userMessage.includes("password") || userMessage.includes("sandi") || userMessage.includes("zip") || userMessage.includes("rar") || userMessage.includes("dekripsi")) {
        reply += "\n\n" + fallbackReplies.password;
      } else {
        reply += "\n\nAda yang bisa saya bantu terkait transaksi, lisensi digital, atau kendala download produk Anda? Jika ada masalah transaksi yang membutuhkan tindakan manual admin, mohon gunakan tab 'Form Pengaduan' untuk membuat tiket dukungan resmi.";
      }
      
      return res.status(200).json({ success: true, reply, isAi: false });
    }

    // Build the payload for the Gemini SDK using generateContent
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // Add system instruction explaining the support role
    let transactionContextString = "";
    if (transactionContext && typeof transactionContext === "object") {
      transactionContextString = `\nBerikut data transaksi pelanggan saat ini untuk referensi Anda: ${JSON.stringify(transactionContext)}`;
    }

    const systemInstruction = `Anda adalah "Zera", asisten AI Customer Care interaktif dari platform marketplace produk digital "DigiMarket". 
Tugas Anda adalah melayani pertanyaan, keluhan, dan konsultasi pelanggan secara profesional, ramah, dan sangat solutif.
Gunakan Bahasa Indonesia yang hangat, sopan, dan terstruktur.

Kategori masalah yang biasa Anda hadapi:
1. Gagal Download: Link rusak/kecepatan lambat. Solusi: Minta pengguna melapor via form pengaduan agar admin men-generate link baru.
2. Lisensi Tidak Valid: Kode lisensi tidak bisa diaktifkan. Solusi: Minta mereka memastikan tidak ada spasi saat copy-paste, atau tawarkan penggantian key melalui form pengaduan.
3. Masalah Pembayaran: Status masih pending walau sudah bayar. Solusi: Beritahu bahwa admin memproses verifikasi secepatnya, atau minta upload bukti transfer via form pengaduan.
4. Sandi Dekripsi Salah: Password zip/rar salah. Solusi: Tunjukkan cara melihat password di Brankas Digital mereka.

${transactionContextString}

Catatan Penting:
- Jangan pernah berjanji palsu. Jika masalah memerlukan tindakan manual admin (seperti mengganti lisensi, mengembalikan dana, atau memverifikasi pembayaran secara manual), arahkan mereka untuk beralih ke tab "Form Pengaduan" untuk mengajukan tiket resmi.
- Selalu bersikap santun, gunakan emoji secara natural untuk menambah kehangatan, dan jawab dengan ringkas namun jelas agar nyaman dibaca di layar chat kecil.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const replyText = response.text || "Mohon maaf, saya sedang mengalami kendala jaringan. Silakan coba kirim pesan Anda kembali.";
    return res.status(200).json({ success: true, reply: replyText, isAi: true });

  } catch (err: any) {
    console.error("Gemini Chat Error:", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal Server Error" });
  }
});

// Serve frontend assets & mount Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== "1") {
  startServer();
}

export default app;
