require("dotenv").config();
const db = require("./models/sync_db");

const runSeeder = async () => {
  try {
    console.log("Seeding database...");
    await db.sequelize.sync({ force: true });

    const jabatanAdmin = await db.Jabatan.db.create({
      nama_jabatan: "Administrator",
      gaji_pokok: 12000000,
      insentif_transport: 500000,
      insentif_makan: 400000,
      nilai_bpjs_kesehatan: 200000,
      potongan_bpjs_kesehatan: 100000,
      nilai_bpjs_tk: 150000,
      potongan_bpjs_tk: 75000,
    });

    const jabatanStaff = await db.Jabatan.db.create({
      nama_jabatan: "Staff Operasional",
      gaji_pokok: 7000000,
      insentif_transport: 300000,
      insentif_makan: 250000,
      nilai_bpjs_kesehatan: 150000,
      potongan_bpjs_kesehatan: 75000,
      nilai_bpjs_tk: 100000,
      potongan_bpjs_tk: 50000,
    });

    const adminPassword = await db.Pegawai.cls.setPassword("Admin123!");
    const staffPassword = await db.Pegawai.cls.setPassword("Staff123!");
    const pegawaiPassword = await db.Pegawai.cls.setPassword("Pegawai123!");

    const admin = await db.Pegawai.db.create({
      nik: "0001",
      nama: "Fajar Admin",
      tempat_lahir: "Jakarta",
      tanggal_lahir: "1988-05-10",
      no_telp: "081234567890",
      email: "admin@company.test",
      tanggal_masuk: "2020-01-10",
      tanggal_keluar: null,
      role: "Admin",
      is_active: true,
      flag_duplicate_nik: false,
      id_jabatan: jabatanAdmin.id,
      ...adminPassword,
    });

    const staff1 = await db.Pegawai.db.create({
      nik: "0002",
      nama: "Rina Staff",
      tempat_lahir: "Bandung",
      tanggal_lahir: "1993-08-24",
      no_telp: "081987654321",
      email: "rina.staff@company.test",
      tanggal_masuk: "2022-02-15",
      tanggal_keluar: null,
      role: "Pegawai",
      is_active: true,
      flag_duplicate_nik: false,
      id_jabatan: jabatanStaff.id,
      ...staffPassword,
    });

    const staff2 = await db.Pegawai.db.create({
      nik: "0003",
      nama: "Dedi Operator",
      tempat_lahir: "Surabaya",
      tanggal_lahir: "1995-11-05",
      no_telp: "081555666777",
      email: "dedi.operator@company.test",
      tanggal_masuk: "2023-03-01",
      tanggal_keluar: null,
      role: "Pegawai",
      is_active: true,
      flag_duplicate_nik: false,
      id_jabatan: jabatanStaff.id,
      ...pegawaiPassword,
    });

    await db.SettingGlobal.db.create({
      potongan_terlambat_per_hari: 50000,
      insentif_lembur_per_jam: 20000,
      jam_masuk: "08:00:00",
      radius_gps: 100,
    });

    await db.Absensi.db.bulkCreate([
      {
        id_pegawai: staff1.id,
        tanggal: "2024-05-06",
        jam_masuk: "08:12:00",
        status: "Hadir",
        foto_masuk: "foto_0002_20240506.jpg",
        catatan: "Datang terlambat 12 menit",
        validasi_oleh: "Fajar Admin",
        status_validasi: "approved",
        tanggal_validasi: "2024-05-06 08:30:00",
        lokasi_masuk: "Kantor Pusat",
        nilai_potongan: 50000,
        total_potongan: 50000,
      },
      {
        id_pegawai: staff2.id,
        tanggal: "2024-05-06",
        jam_masuk: "07:55:00",
        status: "Hadir",
        foto_masuk: "foto_0003_20240506.jpg",
        catatan: "Tepat waktu",
        validasi_oleh: "Fajar Admin",
        status_validasi: "approved",
        tanggal_validasi: "2024-05-06 08:10:00",
        lokasi_masuk: "Kantor Cabang",
        nilai_potongan: 0,
        total_potongan: 0,
      },
      {
        id_pegawai: staff1.id,
        tanggal: "2026-06-19",
        jam_masuk: "08:12:00",
        status: "Hadir",
        foto_masuk: "foto_0002_20240506.jpg",
        catatan: "Datang terlambat 12 menit",
        validasi_oleh: null,
        status_validasi: "pending",
        tanggal_validasi: null,
        lokasi_masuk: "Kantor Pusat",
        nilai_potongan: 50000,
        total_potongan: 50000,
      },
      {
        id_pegawai: staff2.id,
        tanggal: "2026-06-19",
        jam_masuk: "07:55:00",
        status: "Hadir",
        foto_masuk: "foto_0003_20240506.jpg",
        catatan: "Tepat waktu",
        validasi_oleh: null,
        status_validasi: "pending",
        tanggal_validasi: null,
        lokasi_masuk: "Kantor Cabang",
        nilai_potongan: 0,
        total_potongan: 0,
      },
    ]);

    await db.Notifikasi.db.bulkCreate([
      {
        id_pegawai: staff1.id,
        type: "Info",
        title: "Pengajuan Lembur Disetujui",
        message: "Lembur Anda tanggal 2024-05-05 telah disetujui.",
        is_read: false,
        link: "/lembur/1",
      },
      {
        id_pegawai: staff2.id,
        type: "Reminder",
        title: "Reminder Absensi",
        message: "Jangan lupa absen masuk sebelum jam 08:00.",
        is_read: false,
        link: "/absensi",
      },
    ]);

    await db.Lembur.db.bulkCreate([
      {
        id_pegawai: staff1.id,
        tanggal_lembur: "2024-05-05",
        jam_mulai: "18:00:00",
        jam_selesai: "20:30:00",
        durasi: 2.5,
        keterangan: "Diperlukan untuk penutupan laporan akhir bulan.",
        status: "Approved",
        approved_at: "2024-05-05 17:30:00",
        nilai_insentif: 150000,
        total_insentif: 150000,
      },
      {
        id_pegawai: staff2.id,
        tanggal_lembur: "2024-05-10",
        jam_mulai: "17:30:00",
        jam_selesai: "19:30:00",
        durasi: 2.0,
        keterangan: "Bantuan operasional shift malam.",
        status: "Menunggu Konfirmasi",
        approved_at: null,
        nilai_insentif: 120000,
        total_insentif: 120000,
      },
    ]);

    await db.Penggajian.db.bulkCreate([
      {
        id_pegawai: staff1.id,
        periode_bulan: 5,
        periode_tahun: 2024,
        total_gaji_pokok: 7000000,
        total_insentif_transport: 300000,
        total_insentif_makan: 250000,
        total_insentif_lembur: 150000,
        total_potongan_terlambat: 50000,
        total_potongan_bpjs: 75000,
        total_potongan_tk: 50000,
        total_gaji: 7400000,
        status_closing: true,
        closed_by: admin.id,
        closed_at: "2024-05-31 18:00:00",
      },
      {
        id_pegawai: staff2.id,
        periode_bulan: 5,
        periode_tahun: 2024,
        total_gaji_pokok: 7000000,
        total_insentif_transport: 300000,
        total_insentif_makan: 250000,
        total_insentif_lembur: 120000,
        total_potongan_terlambat: 0,
        total_potongan_bpjs: 75000,
        total_potongan_tk: 50000,
        total_gaji: 7375000,
        status_closing: false,
        closed_by: null,
        closed_at: null,
      },
    ]);

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeder failed:", error);
    process.exit(1);
  }
};

runSeeder();
