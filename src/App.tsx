import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { BrowserRouter as Router, Routes, Route, useParams, Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ==========================================
// HALAMAN 1: FORM PENGADUAN PENGHUNI
// ==========================================
function FormKeluhan() {
  const [loading, setLoading] = useState(false);
  const [errorPesan, setErrorPesan] = useState("");
  const [tiketSukses, setTiketSukses] = useState("");

  const kirimTiket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorPesan("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    data.origin = window.location.origin;

    try {
      const respon = await fetch("/api/tiket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const hasil = await respon.json();
      if (hasil.success) setTiketSukses(hasil.ticketId);
      else setErrorPesan(`❌ Gagal: ${hasil.error}`);
    } catch (err) {
      setErrorPesan(`❌ Terjadi kesalahan jaringan.`);
    } finally {
      setLoading(false);
    }
  };

  const urlPelacakan = `${window.location.origin}/status/${tiketSukses}`;

  return (
    <div className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40">
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/logo.png" alt="Logo Bumi Kartika Asri" className="h-24 object-contain mb-2" />
        <p className="text-sm font-medium text-gray-500">Layanan IT Helpdesk Asrama</p>
      </div>
      {errorPesan && <div className="p-4 mb-4 rounded-lg text-sm font-bold text-center bg-red-100 text-red-700">{errorPesan}</div>}

      {tiketSukses ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-bold text-sm mb-6 flex items-center gap-2">✅ Tiket Berhasil Dibuat!</div>
          <h2 className="text-3xl font-black text-gray-800 tracking-wider mb-2">{tiketSukses}</h2>
          <p className="text-xs text-gray-500 mb-6 text-center">Simpan nomor atau scan QR Code di bawah untuk melacak progres.</p>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <QRCode value={urlPelacakan} size={160} className="mx-auto" />
          </div>
          <button onClick={() => setTiketSukses("")} className="w-full py-3 font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg mb-2">
            Buat Laporan Baru
          </button>
          <Link to={`/status/${tiketSukses}`} className="w-full py-3 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-center">
            Cek Status Sekarang
          </Link>
        </div>
      ) : (
        <form onSubmit={kirimTiket} className="space-y-4 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nama</label>
              <input type="text" name="nama" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan Nama" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
              <input type="email" name="email" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan Email " />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Gedung</label>
              <select name="gedung" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none">
                <option value="">Pilih</option>
                <option value="EKA">EKA</option>
                <option value="DWI">DWI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Lantai</label>
              <select name="lantai" required className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none">
                <option value="">Pilih</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Kamar</label>
              <input type="text" name="kamar" required placeholder="213" className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Detail Kendala</label>
            <textarea name="kendala" required rows={3} className="w-full px-4 py-2 bg-gray-50 border rounded-lg outline-none resize-none" placeholder="Masukkan Kendala Anda"></textarea>
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 mt-2 font-bold text-white rounded-lg ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}>
            {loading ? "Memproses..." : "Kirim Tiket Laporan"}
          </button>
        </form>
      )}
    </div>
  );
}

// ==========================================
// HALAMAN 2: CEK STATUS TIKET PENGHUNI (DENGAN AUTO-REFRESH)
// ==========================================
function StatusTiket() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTiket = async (sembunyiLoading = false) => {
      if (!sembunyiLoading) setLoading(true);
      try {
        const respon = await fetch(`/api/tiket/${id}`);
        const hasil = await respon.json();
        if (hasil.success) setData(hasil.data);
        else setError(hasil.error || "Tiket tidak ditemukan.");
      } catch (err) {
        if (!sembunyiLoading) setError("Gagal terhubung ke server.");
      } finally {
        if (!sembunyiLoading) setLoading(false);
      }
    };
    fetchTiket();
    const intervalId = setInterval(() => {
      fetchTiket(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [id]);

  return (
    <div className="max-w-md w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/40 transition-all">
      <div className="flex flex-col items-center justify-center mb-6">
        <img src="/logo.png" alt="Logo" className="h-20 object-contain mb-2" />
        <h2 className="text-xl font-bold text-gray-800">Status Laporan</h2>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 my-10 animate-pulse">Memuat status...</p>
      ) : error ? (
        <div className="text-center">
          <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            Kembali
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Nomor Tiket</p>
            <h3 className="text-2xl font-black text-gray-800">{data.id}</h3>
          </div>
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-sm font-semibold text-gray-600">Status Saat Ini:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-500
              ${data.status === "Pending" ? "bg-orange-100 text-orange-700" : data.status === "Proses" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
            >
              {data.status === "Pending" ? "Menunggu" : data.status === "Proses" ? "Dikerjakan" : "Selesai"}
            </span>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Nama:</span> <span className="font-semibold text-gray-800">{data.nama}</span>
            </p>
            <p>
              <span className="text-gray-500">Lokasi:</span>{" "}
              <span className="font-semibold text-gray-800">
                Gedung {data.gedung}, Lt.{data.lantai}, Kmr.{data.kamar}
              </span>
            </p>
            <div>
              <span className="text-gray-500 block mb-1">Kendala:</span>
              <p className="bg-white p-2 rounded border border-gray-200 text-gray-700 italic">"{data.kendala}"</p>
            </div>
          </div>
          <div className="flex justify-center items-center mt-2 gap-2 text-xs text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Terhubung (Otomatis Diperbarui)
          </div>
          <Link to="/" className="block w-full py-3 mt-4 font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg text-center transition-all">
            Kembali
          </Link>
        </div>
      )}
    </div>
  );
}

// ==========================================
// HALAMAN 3: LOGIN ADMIN
// ==========================================
function LoginAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const respon = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const hasil = await respon.json();
      if (hasil.success) {
        localStorage.setItem("adminToken", hasil.token);
        navigate("/admin/dashboard");
      } else setError("Username atau Password salah!");
    } catch (err) {
      setError("Kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-6 absolute inset-0 z-50">
      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-20 object-contain mb-4" />
          <h2 className="text-2xl font-black text-slate-800">Portal IT Support</h2>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded mb-6 text-sm font-bold border-l-4 border-red-500">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Username</label>
            <input type="text" name="username" required className="w-full px-4 py-3 border bg-slate-50  rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Password</label>
            <input type="password" name="password" required className="w-full px-4 py-3 border bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 mt-4 bg-green-800 text-white font-bold rounded-xl hover:bg-green-500 shadow-lg">
            {loading ? "Otentikasi..." : "Masuk ke Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// HALAMAN 4: DASHBOARD ADMIN
// ==========================================
function DashboardAdmin() {
  const [tiket, setTiket] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuAktif, setMenuAktif] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterGedung, setFilterGedung] = useState("");
  const [filterLantai, setFilterLantai] = useState("");
  const [filterKamar, setFilterKamar] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const navigate = useNavigate();

  // Fungsi penarik data 
  const fetchTiket = async (sembunyiLoading = false) => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
      return;
    }
    if (!sembunyiLoading) setLoading(true);
    try {
      const respon = await fetch("/api/admin/tickets", { headers: { Authorization: `Bearer ${token}` } });
      if (respon.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin");
        return;
      }
      const hasil = await respon.json();
      if (hasil.success) setTiket(hasil.data);
    } catch (err) {
      console.error("Gagal menarik data:", err);
    } finally {
      if (!sembunyiLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiket();
    const intervalId = setInterval(() => {
      fetchTiket(true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const ubahStatus = async (id: string, statusBaru: string) => {
    setTiket((prevTiket) => prevTiket.map((t) => (t.id === id ? { ...t, status: statusBaru } : t)));
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusBaru }),
      });
    } catch (err) {
      fetchTiket(true);
    }
  };

  const hapusTiket = async (id: string) => {
    const konfirmasi = window.confirm(`Yakin ingin menghapus tiket ${id}?`);
    if (!konfirmasi) return;
    setTiket((prevTiket) => prevTiket.filter((t) => t.id !== id));
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`/api/admin/tickets/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      fetchTiket(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };
  const formatWaktuLokal = (waktuDariDB: string) => {
    const formatBaku = waktuDariDB.replace(" ", "T") + "Z";
    return new Date(formatBaku).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const tiketTerfilter = tiket.filter((t) => {
    const matchGedung = filterGedung ? t.gedung.toUpperCase().includes(filterGedung.toUpperCase()) : true;
    const matchLantai = filterLantai ? t.lantai === filterLantai : true;
    const matchKamar = filterKamar ? t.kamar.toLowerCase() === filterKamar.toLowerCase() : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchGedung && matchLantai && matchKamar && matchStatus;
  });

  const exportKeExcel = () => {
    const headers = ["ID Tiket", "Tanggal & Waktu", "Nama Pelapor", "Gedung", "Lantai", "Kamar", "Kendala", "Status"];
    const barisData = tiketTerfilter.map((t) => {
      const kendalaBersih = t.kendala.replace(/,/g, " -").replace(/\n/g, " ");
      return `"${t.id}","${formatWaktuLokal(t.createdAt)}","${t.nama}","${t.gedung}","${t.lantai}","${t.kamar}","${kendalaBersih}","${t.status}"`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8," + headers.join(",") + "\n" + barisData.join("\n")));
    link.setAttribute("download", `Laporan_BKA_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const total = tiket.length;
  const menunggu = tiket.filter((t) => t.status === "Pending").length;
  const dikerjakan = tiket.filter((t) => t.status === "Proses").length;
  const selesai = tiket.filter((t) => t.status === "Selesai").length;

  const dataGedungRaw = { "Gedung EKA": 0, "Gedung DWI": 0 };
  tiketTerfilter.forEach((t) => {
    const nama = t.gedung.toUpperCase();
    if (nama.includes("EKA")) dataGedungRaw["Gedung EKA"] += 1;
    else if (nama.includes("DWI")) dataGedungRaw["Gedung DWI"] += 1;
  });
  const chartData = Object.keys(dataGedungRaw).map((key) => ({ name: key, Jumlah: dataGedungRaw[key as keyof typeof dataGedungRaw] }));

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-50">
        <p className="animate-pulse font-bold text-gray-500">Memuat Dashboard...</p>
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#f8f9fa] absolute inset-0 z-50 overflow-hidden font-sans">
      
      {/* MOBILE HEADER (Hanya muncul di HP) */}
      <div className="md:hidden flex items-center justify-between bg-white px-6 py-4 border-b border-gray-200 z-30 shrink-0 shadow-sm">
        <img src="/logo.png" alt="Logo" className="h-10 object-contain" />
        <div className="flex items-center gap-4">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 rounded-lg text-gray-600 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>

      {/* OVERLAY HITAM UNTUK MENU MOBILE */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR (Responsive: Fixed di HP, Statis di Laptop) */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-20 md:h-24 flex items-center justify-between md:justify-center px-6 md:px-0 border-b border-transparent mt-2 md:mt-4 mb-4">
          <img src="/logo.png" alt="Logo" className="h-12 md:h-16 object-contain" />
          <button className="md:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-2">
          <button onClick={() => { setMenuAktif('dashboard'); setIsSidebarOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all ${menuAktif === 'dashboard' ? 'bg-[#f0f9f4] text-[#4caf50]' : 'text-gray-600 hover:bg-gray-50'}`}>Dashboard</button>
          <button onClick={() => { setMenuAktif('tiket'); setIsSidebarOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all ${menuAktif === 'tiket' ? 'bg-[#f0f9f4] text-[#4caf50]' : 'text-gray-600 hover:bg-gray-50'}`}>Tiket Masuk</button>
        </nav>
        <div className="p-4 mb-4"><button onClick={handleLogout} className="w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold">Keluar</button></div>
      </aside>

      {/* AREA UTAMA (KONTEN) */}
      <main className="flex-1 overflow-auto p-4 md:p-8 flex flex-col relative">
        <div className="hidden md:flex absolute top-6 right-8 items-center gap-2">
           <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Real-Time Aktif</span>
        </div>

        {menuAktif === 'dashboard' && (
          <>
            <div className="mb-6 shrink-0 pt-2 md:pt-0"><h1 className="text-2xl md:text-3xl font-bold text-slate-800">Dashboard Laporan</h1></div>
            
            {/* KARTU RINGKASAN: 2 Kolom di HP, 4 Kolom di Laptop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 shrink-0">
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border"><p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Total</p><h3 className="text-2xl md:text-4xl font-black">{total}</h3></div>
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border"><p className="text-[10px] md:text-xs font-bold text-orange-500 uppercase">Menunggu</p><h3 className="text-2xl md:text-4xl font-black">{menunggu}</h3></div>
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border"><p className="text-[10px] md:text-xs font-bold text-blue-500 uppercase">Dikerjakan</p><h3 className="text-2xl md:text-4xl font-black">{dikerjakan}</h3></div>
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border"><p className="text-[10px] md:text-xs font-bold text-green-500 uppercase">Selesai</p><h3 className="text-2xl md:text-4xl font-black">{selesai}</h3></div>
            </div>

            {/* GRAFIK & TIKET TERBARU: 1 Kolom memanjang ke bawah di HP, 3 Kolom menyamping di Laptop */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px] lg:min-h-[450px]">
              
              <div className="col-span-1 bg-white p-4 md:p-6 rounded-2xl shadow-sm border flex flex-col min-h-[300px]">
                <h3 className="text-lg font-bold text-slate-800 mb-4 shrink-0">Perbandingan</h3>
                {/* FILTER GRAFIK */}
                <div className="flex flex-col gap-2 mb-4">
                  <select value={filterGedung} onChange={(e) => setFilterGedung(e.target.value)} className="bg-slate-50 border text-xs font-bold text-slate-600 rounded-lg px-3 py-2 outline-none w-full"><option value="">Semua Gedung</option><option value="EKA">EKA</option><option value="DWI">DWI</option></select>
                  <div className="flex gap-2 w-full">
                    <select value={filterLantai} onChange={(e) => setFilterLantai(e.target.value)} className="w-1/2 bg-slate-50 border text-xs font-bold rounded-lg px-3 py-2 outline-none"><option value="">Lantai</option><option value="1">Lt 1</option><option value="2">Lt 2</option><option value="3">Lt 3</option><option value="4">Lt 4</option></select>
                    <input type="text" placeholder="Kmr (123)" value={filterKamar} onChange={(e) => setFilterKamar(e.target.value)} className="w-1/2 bg-slate-50 border text-xs font-bold rounded-lg px-3 py-2 outline-none" />
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[150px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: -20, top: 10 }}><XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis allowDecimals={false} tick={{fontSize: 11}} /><Tooltip /><Bar dataKey="Jumlah" fill="#3a7bd5" radius={[6,6,0,0]} barSize={40} /></BarChart></ResponsiveContainer></div>
              </div>

              <div className="col-span-1 lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl shadow-sm border flex flex-col min-h-[400px]">
                <h3 className="text-lg font-bold text-slate-800 mb-4 shrink-0">Tiket Terbaru</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {tiket.slice(0, 10).map((t) => (
                    <div key={t.id} className="border border-gray-100 p-4 rounded-xl shadow-sm bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 items-center mb-1"><span className="font-black text-slate-700">{t.id}</span><span className="text-[10px] text-gray-400 font-semibold">{formatWaktuLokal(t.createdAt)}</span></div>
                        <h4 className="font-bold text-sm text-slate-800 mt-1">{t.nama}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">Gedung {t.gedung} - Kmr.{t.kamar}</p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-48 shrink-0">
                        <select value={t.status} onChange={(e) => ubahStatus(t.id, e.target.value)} className={`flex-1 text-xs font-bold rounded-lg outline-none p-2.5 border ${t.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : t.status === 'Proses' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><option value="Pending">🕒 Menunggu</option><option value="Proses">⚙️ Dikerjakan</option><option value="Selesai">✅ Selesai</option></select>
                        <button onClick={() => hapusTiket(t.id)} className="bg-red-50 text-red-600 px-3 rounded-lg hover:bg-red-100 font-bold">🗑</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {menuAktif === 'tiket' && (
           <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 md:p-6 border-b shrink-0 bg-white">
               <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-4">
                 <div><h2 className="text-xl md:text-2xl font-bold">Semua Tiket Laporan</h2></div>
                 <button onClick={exportKeExcel} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold w-full md:w-auto">Export Excel (CSV)</button>
               </div>
               {/* FILTER TABEL: Fleksibel dan membungkus ke bawah di HP */}
               <div className="flex flex-wrap gap-2 md:gap-3 bg-slate-50 p-3 rounded-xl border">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 md:flex-none min-w-[120px] bg-white border text-sm rounded-lg px-3 py-2"><option value="">Semua Status</option><option value="Pending">Menunggu</option><option value="Proses">Dikerjakan</option><option value="Selesai">Selesai</option></select>
                  <select value={filterGedung} onChange={(e) => setFilterGedung(e.target.value)} className="flex-1 md:flex-none min-w-[120px] bg-white border text-sm rounded-lg px-3 py-2"><option value="">Semua Gedung</option><option value="EKA">EKA</option><option value="DWI">DWI</option></select>
                  <select value={filterLantai} onChange={(e) => setFilterLantai(e.target.value)} className="flex-1 md:flex-none min-w-[120px] bg-white border text-sm rounded-lg px-3 py-2"><option value="">Lantai</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
                  <input type="text" placeholder="Kamar (213)" value={filterKamar} onChange={(e) => setFilterKamar(e.target.value)} className="flex-1 md:flex-none min-w-[100px] bg-white border text-sm rounded-lg px-3 py-2" />
                  <button onClick={() => { setFilterGedung(''); setFilterLantai(''); setFilterKamar(''); setFilterStatus(''); }} className="w-full md:w-auto mt-2 md:mt-0 text-sm font-bold text-blue-600 bg-blue-50 md:bg-transparent rounded-lg py-2 px-3 hover:bg-blue-100">Reset</button>
               </div>
             </div>
             
             {/* AREA TABEL: Otomatis bisa di-scroll ke samping di HP */}
             <div className="flex-1 overflow-auto bg-slate-50/50">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead className="sticky top-0 bg-white shadow-sm z-10">
                   <tr className="border-b text-slate-500 uppercase text-[11px] font-bold"><th className="px-4 py-4">ID & Waktu</th><th className="px-4 py-4">Pelapor</th><th className="px-4 py-4">Lokasi</th><th className="px-4 py-4 min-w-[250px]">Kendala</th><th className="px-4 py-4">Aksi</th></tr>
                 </thead>
                 <tbody className="divide-y text-sm bg-white">
                   {tiketTerfilter.map((t) => (
                     <tr key={t.id} className="hover:bg-blue-50/30">
                       <td className="px-4 py-4 align-top"><div className="font-black text-slate-700">{t.id}</div><div className="text-[11px] text-slate-400 mt-1">{formatWaktuLokal(t.createdAt)}</div></td>
                       <td className="px-4 py-4 align-top"><div className="font-bold text-slate-700">{t.nama}</div><div className="text-xs text-slate-500">{t.email || '-'}</div></td>
                       <td className="px-4 py-4 align-top"><div className="bg-slate-100 px-3 py-1.5 rounded-lg border font-bold text-slate-700">Gedung {t.gedung} <br/><span className="text-xs font-normal text-slate-500">Lt.{t.lantai}, Kmr.{t.kamar}</span></div></td>
                       <td className="px-4 py-4 align-top"><p className="bg-slate-50 px-3 py-2 rounded-lg border text-xs text-slate-600">{t.kendala}</p></td>
                       <td className="px-4 py-4 align-top">
                         <div className="flex flex-col gap-2">
                           <select value={t.status} onChange={(e) => ubahStatus(t.id, e.target.value)} className={`w-32 text-xs font-bold rounded-lg p-2 border outline-none ${t.status === 'Pending' ? 'bg-orange-50 text-orange-700 border-orange-200' : t.status === 'Proses' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}><option value="Pending">🕒 Menunggu</option><option value="Proses">⚙️ Dikerjakan</option><option value="Selesai">✅ Selesai</option></select>
                           <button onClick={() => hapusTiket(t.id)} className="w-32 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 font-bold text-xs text-center">Hapus</button>
                         </div>
                       </td>
                     </tr>
                   ))}
                   {tiketTerfilter.length === 0 && (<tr><td colSpan={5} className="text-center p-10 text-slate-500">Tidak ada tiket.</td></tr>)}
                 </tbody>
               </table>
             </div>
           </div>
        )}
      </main>
    </div>
  );
}

// ==========================================
// KOMPONEN UTAMA (ROUTER SETUP)
// ==========================================
export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-200 flex items-center justify-center font-sans">
        <Routes>
          <Route path="/" element={<FormKeluhan />} />
          <Route path="/status/:id" element={<StatusTiket />} />
          <Route path="/admin" element={<LoginAdmin />} />
          <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        </Routes>
      </div>
    </Router>
  );
}
