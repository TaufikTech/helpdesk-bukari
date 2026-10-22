import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { tickets } from "../src/db/schema.ts";

export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
  ADMIN_TOKEN: string;
  GOOGLE_SCRIPT_URL: string;
}

// 1. Fungsi Telegram (Saat Tiket Dibuat)
async function kirimNotifikasiTelegram(env: Env, dataTiket: any) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;

  const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const pesan = `🚨 *TIKET KENDALA BARU* 🚨\n\n*ID:* ${dataTiket.id}\n*Nama:* ${dataTiket.nama}\n*Lokasi:* Gedung ${dataTiket.gedung}, Lt.${dataTiket.lantai}, Kmr.${dataTiket.kamar}\n*Kendala:* ${dataTiket.kendala}\n\n*Waktu:* ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`;

  // 1. Memisahkan string dari env menjadi array, lalu menghapus spasi jika ada
  const chatIds = env.TELEGRAM_CHAT_ID.split(",").map((id) => id.trim());

  // 2. Lakukan perulangan untuk mengirim pesan ke setiap chat_id
  for (const chatId of chatIds) {
    if (!chatId) continue; // Lewati jika ada elemen kosong akibat salah ketik koma

    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId, // Menggunakan ID hasil perulangan
          text: pesan,
          parse_mode: "Markdown",
        }),
      });
    } catch (e) {
      console.error(`Gagal mengirim pesan ke ID ${chatId}:`, e);
    }
  }
}

// 2. Fungsi Kirim Email (Saat Tiket Dibuat)
async function kirimEmailPenghuni(env: Env, dataTiket: any) {
  if (!env.GOOGLE_SCRIPT_URL || !dataTiket.email) return;
  const urlPelacakan = `${dataTiket.origin}/status/${dataTiket.id}`;
  const gambarQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlPelacakan)}`;

  const htmlEmail = `
    <div style="font-family: Arial, sans-serif; max-w: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
        <h2 style="margin: 0; color: #1e293b;">Bumi Kartika Asri</h2>
        <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Layanan IT Helpdesk</p>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p>Halo <strong>${dataTiket.nama}</strong>,</p>
        <p>Laporan kendala Anda telah kami terima dan sudah masuk ke dalam antrean tim IT kami.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>ID Tiket:</strong> <span style="color: #2563eb; font-weight: bold;">${dataTiket.id}</span></p>
          <p style="margin: 0 0 8px 0;"><strong>Lokasi:</strong> Gedung ${dataTiket.gedung} - Lt.${dataTiket.lantai} - Kmr.${dataTiket.kamar}</p>
          <p style="margin: 0;"><strong>Kendala:</strong> ${dataTiket.kendala}</p>
        </div>
        <p style="text-align: center; margin-bottom: 10px;">QR Code Status Tiket:</p>
        <div style="text-align: center; margin: 20px 0;"><img src="${gambarQRCode}" alt="QR Code" style="border-radius: 8px; border: 1px solid #e5e7eb;" /></div>
        <div style="text-align: center;"><a href="${urlPelacakan}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">Cek Status Sekarang</a></div>
      </div>
    </div>
  `;

  try {
    await fetch(env.GOOGLE_SCRIPT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: dataTiket.email, subject: `[${dataTiket.id}] Laporan Kendala Diterima`, html: htmlEmail }) });
  } catch (e) {}
}

async function kirimEmailSelesai(env: Env, dataTiket: any) {
  if (!env.GOOGLE_SCRIPT_URL || !dataTiket.email) return;

  const htmlEmail = `
    <div style="font-family: Arial, sans-serif; max-w: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #10b981; padding: 20px; text-align: center;">
        <h2 style="margin: 0; color: #ffffff;">Kendala Selesai Ditangani! 🎉</h2>
      </div>
      <div style="padding: 24px; color: #334155;">
        <p>Halo <strong>${dataTiket.nama}</strong>,</p>
        <p>Kabar baik! Laporan kendala IT Anda dengan nomor tiket <strong>${dataTiket.id}</strong> telah <strong>selesai diperbaiki</strong> oleh tim IT kami.</p>
        
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0;"><strong>Lokasi:</strong> Gedung ${dataTiket.gedung} - Lt.${dataTiket.lantai} - Kmr.${dataTiket.kamar}</p>
          <p style="margin: 0;"><strong>Kendala yang dilaporkan:</strong> ${dataTiket.kendala}</p>
        </div>

        <p>Terima kasih telah mempercayakan kenyamanan Anda pada layanan IT Helpdesk Bumi Kartika Asri. Jika ada kendala lain di masa depan, jangan ragu untuk melapor kembali!</p>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e5e7eb;">
        Pesan ini dibuat otomatis oleh Sistem Helpdesk BKA.<br/>Mohon untuk tidak membalas email ini.
      </div>
    </div>
  `;

  try {
    await fetch(env.GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: dataTiket.email,
        subject: `[${dataTiket.id}] Laporan Kendala Telah Selesai ✅`,
        html: htmlEmail,
      }),
    });
  } catch (e) {
    console.error("Gagal kirim via Google Script", e);
  }
}

function cekOtorisasi(request: Request, env: Env) {
  const authHeader = request.headers.get("Authorization");
  return authHeader === `Bearer ${env.ADMIN_TOKEN}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/tiket" && request.method === "POST") {
      try {
        const db = drizzle(env.DB);
        const data = await request.json<any>();
        const ticketId = `IT-${Math.floor(Math.random() * 9000) + 1000}`;

        await db
          .insert(tickets)
          .values({
            id: ticketId,
            nama: data.nama,
            email: data.email,
            gedung: data.gedung,
            lantai: data.lantai,
            kamar: data.kamar,
            kendala: data.kendala,
            status: "Pending",
          })
          .returning();
        await Promise.all([kirimNotifikasiTelegram(env, { id: ticketId, ...data }), kirimEmailPenghuni(env, { id: ticketId, ...data })]);

        return new Response(JSON.stringify({ success: true, ticketId }), { status: 200, headers: { "Content-Type": "application/json" } });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
      }
    }

    const statusMatch = url.pathname.match(/^\/api\/tiket\/(IT-\d+)$/);
    if (statusMatch && request.method === "GET") {
      try {
        const db = drizzle(env.DB);
        const hasilCari = await db.select().from(tickets).where(eq(tickets.id, statusMatch[1])).limit(1);
        if (hasilCari.length === 0) return new Response(JSON.stringify({ success: false, error: "Tiket tidak ditemukan" }), { status: 404 });
        return new Response(JSON.stringify({ success: true, data: hasilCari[0] }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" } });
      } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
      }
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const data = await request.json<any>();
      if (data.username === env.ADMIN_USERNAME && data.password === env.ADMIN_PASSWORD) return new Response(JSON.stringify({ success: true, token: env.ADMIN_TOKEN }), { status: 200, headers: { "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: false, error: "Kredensial salah" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/admin/tickets" && request.method === "GET") {
      if (!cekOtorisasi(request, env)) return new Response("Unauthorized", { status: 401 });
      const db = drizzle(env.DB);
      const semuaTiket = await db.select().from(tickets).orderBy(desc(tickets.createdAt));
      return new Response(JSON.stringify({ success: true, data: semuaTiket }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    }

    const ticketMatch = url.pathname.match(/^\/api\/admin\/tickets\/(IT-\d+)$/);
    if (ticketMatch) {
      if (!cekOtorisasi(request, env)) return new Response("Unauthorized", { status: 401 });
      const db = drizzle(env.DB);

      if (request.method === "PATCH") {
        const data = await request.json<any>();

        const tiketLama = await db.select().from(tickets).where(eq(tickets.id, ticketMatch[1])).limit(1);

        await db.update(tickets).set({ status: data.status }).where(eq(tickets.id, ticketMatch[1])).returning();

        if (data.status === "Selesai" && tiketLama.length > 0 && tiketLama[0].status !== "Selesai") {
          await kirimEmailSelesai(env, tiketLama[0]);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }

      if (request.method === "DELETE") {
        await db.delete(tickets).where(eq(tickets.id, ticketMatch[1])).returning();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
    }
    return new Response("Not Found", { status: 404 });
  },
};
