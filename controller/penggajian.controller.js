const { Op, where } = require("sequelize");
const { Penggajian, Absensi, Lembur, Pegawai, Jabatan } = require("../models/sync_db");
const { set_response } = require("./page.controller");
const { sequelize, Sequelize } = require("../models");
const { v4: uuidv4 } = require('uuid');

async function getAll(req, res) {
    const { bulan, tahun } = req.query;
    const whereClause = {};

    try {
        whereClause.status_closing = parseInt(1);
        if (tahun) {
            whereClause.periode_tahun = parseInt(tahun, 10);
        }
        if (bulan) {
            if (!tahun) {
                return res.status(400).json(set_response(400, "Tahun harus disertakan jika menggunakan bulan"));
            }
            whereClause.periode_bulan = parseInt(bulan, 10);
        }

        const datapenggajian = await Penggajian.db.findAll({
            where: whereClause,
            include: [
                {
                    model: Pegawai.db,
                    attributes: ['nama'],
                    include: [
                        {
                            model: Jabatan.db,
                            attributes: ['nama_jabatan']
                        }
                    ]
                }
            ]
            // order: [['periode_tahun', 'DESC'], ['periode_bulan', 'DESC']]
        });
        res.json(set_response(200, "success get all payroll data", datapenggajian));
    } catch (error) {
        console.error(error);
        res.status(500).json(set_response(500, "cannot get all payroll data"));
    }
}

async function getByUid(req, res) {
    const { uid } = req.params

    try {
        const datapenggajian = await Penggajian.db.findOne({
            where: {
                uid: uid
            },
        });
        res.json(set_response(200, "success get penggajian by Id", datapenggajian));
    } catch (error) {
        res.status(503).json(set_response(200, error))
    }

}

async function calculatePayroll(req, res) {
    const { periode_bulan, periode_tahun, refetch } = req.body;


    const startDate = new Date(periode_tahun, periode_bulan - 1, 1);
    const endDate = new Date(periode_tahun, periode_bulan, 0);

    if (!periode_tahun && !periode_bulan) return res.status(404).json(set_response(404, "missing periode_bulan and periode_tahun"));


    if (refetch) {
        try {
            const penggajian_old = await Penggajian.db.findAll({
                where: {
                    periode_bulan: parseInt(periode_bulan),
                    periode_tahun: parseInt(periode_tahun),
                    status_closing: 0
                },
                include: [
                    {
                        model: Pegawai.db,
                        attributes: ['nama'],
                        include: [
                            {
                                model: Jabatan.db,
                                attributes: ['nama_jabatan']
                            }
                        ]
                    }
                ]
                // order: [['periode_tahun', 'DESC'], ['periode_bulan', 'DESC']]
            });
            if (penggajian_old.length) return res.send(set_response(200, "success get previous penggajian", penggajian_old))
            else return res.status(404).json(set_response(404, "No payroll draft available"));
        } catch (error) {
            return res.status(404).json(set_response(404, `failed get previous data: ${error}`));
        }
    }

    try {
        const getAbsensi = await Absensi.db.findAll({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('tanggal')), periode_tahun),
                    Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('tanggal')), periode_bulan)
                ]
            },
        });
        let previewData = [];
        const pegawaiIds = [...new Set(getAbsensi.map((item) => item.id_pegawai))];
        for (const id_pegawai of pegawaiIds) {
            const pegawaiJabatan = await Pegawai.db.findByPk(id_pegawai, {
                include: [{
                    model: Jabatan.db,
                    required: false
                }]
            });
            let pegawaiLembur = await Lembur.db.findOne({
                where: {
                    id_pegawai,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('tanggal_lembur')), periode_tahun),
                        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('tanggal_lembur')), periode_bulan)
                    ]
                }
            });

            if (!pegawaiLembur) pegawaiLembur = {
                total_insentif: 0,
            }

            const {
                id,
                uid,
                aktif,
                nama_jabatan,
                gaji_pokok,
                insentif_transport,
                insentif_makan,
                nilai_bpjs_kesehatan,
                potongan_bpjs_kesehatan,
                nilai_bpjs_tk,
                potongan_bpjs_tk,
                created_at,
                updated_at,
                delete_at
            } = pegawaiJabatan.m_jabatan;
            const potonganTerlambat = getAbsensi.filter(e => e.id_pegawai === id_pegawai)[0];
            const total_gaji = gaji_pokok + insentif_transport + insentif_makan + pegawaiLembur.total_insentif + nilai_bpjs_kesehatan + nilai_bpjs_tk - (potonganTerlambat.total_potongan + potongan_bpjs_kesehatan + potongan_bpjs_tk);
            const newData = {
                uid: uuidv4(),
                periode_bulan,
                periode_tahun,
                total_gaji_pokok: gaji_pokok,
                total_insentif_transport: insentif_transport,
                total_insentif_makan: insentif_makan,
                total_insentif_lembur: pegawaiLembur.total_insentif,
                total_potongan_terlambat: potonganTerlambat.total_potongan,
                total_potongan_bpjs: potongan_bpjs_kesehatan,
                total_potongan_tk: potongan_bpjs_tk,
                total_gaji,
                status_closing: 0,
                closed_by: null,
                closed_at: null,
                id_pegawai
            }
            previewData.push(newData);
        }
        await Penggajian.db.destroy({
            where: {
                periode_bulan: parseInt(periode_bulan),
                periode_tahun: parseInt(periode_tahun),
                status_closing: false
            }
        });
        for (const data of previewData) {
            try {
                await Penggajian.db.create(data);
            } catch (error) {
                return res.status(503).send(set_response(503, error));
            }
        }
        const previewResult =
            await Penggajian.db.findAll({
                where: {
                    periode_bulan: parseInt(periode_bulan),
                    periode_tahun: parseInt(periode_tahun),
                    status_closing: false
                },
                include: [
                    {
                        model: Pegawai.db,
                        attributes: ['nama'],
                        include: [
                            {
                                model: Jabatan.db,
                                attributes: ['nama_jabatan']
                            }
                        ]
                    }
                ]
            });
        // return res.json(set_response(200, "preview closing created", previewData));
        return res.json(set_response(200, "preview closing created", previewResult)
        );
    } catch (error) {
        return res.status(503).json(set_response(503, `error get absensi: ${error}`));
    }

}

async function updatePenggajian(req, res) {
    const { uid } = req.query;
    const data = req.body;

    const allowedUpdates = [
        'aktif',
        'total_insentif_lembur',
        'total_potongan_terlambat',
        'total_potongan_bpjs',
        'total_potongan_tk',
    ];

    const filteredData = {};
    for (let key of allowedUpdates) {
        if (data[key] !== undefined) {
            filteredData[key] = data[key];
        }
    }

    if (Object.keys(filteredData).length === 0) {
        return res.status(400).json(set_response(400, "No valid fields to update"));
    }

    try {
        const penggajian = await Penggajian.db.findOne({ where: { uid, status_closing: 0 } });
        if (!penggajian) return res.status(404).json(set_response(404, "Payroll data not found"));

        // Ambil nilai existing dari database
        let {
            total_gaji_pokok,
            total_insentif_transport,
            total_insentif_makan,
            total_insentif_lembur,
            total_potongan_terlambat,
            total_potongan_bpjs,
            total_potongan_tk,
        } = penggajian;

        // Timpa dengan nilai baru dari filteredData (jika ada)
        if (filteredData.total_insentif_lembur !== undefined) total_insentif_lembur = filteredData.total_insentif_lembur;
        if (filteredData.total_potongan_terlambat !== undefined) total_potongan_terlambat = filteredData.total_potongan_terlambat;
        if (filteredData.total_potongan_bpjs !== undefined) total_potongan_bpjs = filteredData.total_potongan_bpjs;
        if (filteredData.total_potongan_tk !== undefined) total_potongan_tk = filteredData.total_potongan_tk;

        const total_gaji = total_gaji_pokok
            + total_insentif_transport
            + total_insentif_makan
            + total_insentif_lembur
            + total_potongan_bpjs   // nilai_bpjs_kesehatan dari tabel jabatan
            + total_potongan_tk     // nilai_bpjs_tk
            - (total_potongan_terlambat + total_potongan_bpjs + total_potongan_tk);
        // Hasilnya: total_gaji = (pendapatan kotor) - potongan_terlambat, karena +bpjs -bpjs saling hapus.
        // Jika itu yang Anda maksud, silakan. Jika tidak, sesuaikan.

        // Siapkan data yang akan diupdate (gabungkan filteredData + total_gaji)
        const updateData = {
            ...filteredData,
            total_gaji: total_gaji   // tambahkan hasil perhitungan
        };

        await penggajian.update(updateData);
        const updatedPenggajian = await Penggajian.db.findOne({ where: { uid } });
        return res.status(200).json(set_response(200, "Payroll data updated successfully", updatedPenggajian));
    } catch (error) {
        console.error("Error updating payroll:", error);
        return res.status(500).json(set_response(500, "Internal server error", null, error.message));
    }
}
async function closePayroll(req, res) {
    const { periode_bulan, periode_tahun, closed_by } = req.body;
    const startDate = new Date(periode_tahun, periode_bulan, -1, 1);
    const endDate = new Date(periode_tahun, periode_bulan, 0);
    try {
        const checkPendingAbsensi = await Absensi.db.findAll({
            where: {
                status_validasi: "pending",
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('tanggal')), periode_tahun),
                    Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('tanggal')), periode_bulan),
                ]
            }
        });
        if (checkPendingAbsensi.length)
            return res.status(409).json(set_response(409, "Terdapat pending absensi. Closing dibatalkan!", checkPendingAbsensi))
        const checkPendingLembur = await Lembur.db.findAll({
            where: {
                status: "Menunggu Konfirmasi",
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('tanggal_lembur')), periode_tahun),
                    Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('tanggal_lembur')), periode_bulan),
                ]
            }
        });
        if (checkPendingLembur.length)
            return res.status(409).json(set_response(409, "Terdapat pending lembur. Closing dibatalkan"));
        const penggajian = await Penggajian.db.update(
            {
                status_closing: 1,
                closed_by
            },
            {
                where: {
                    periode_bulan: parseInt(periode_bulan, 10),
                    periode_tahun: parseInt(periode_tahun, 10),
                    status_closing: 0
                }
            });
        res.json(set_response(200, "closing gaji berhasil!", penggajian));
    } catch (error) {
        res.status(503).json(set_response(503, error));
    }
}

async function viewSlipGaji(req, res) {
    const { uid } = req.params;
    try {
        const slipGaji = await Penggajian.db.findOne({
            where: {
                uid,
            }
        });
        if (slipGaji)
            res.json(set_response(200, "Success get slip gaji", slipGaji));
    } catch (error) {
        console.log(error);
        res.status(503).json(set_response(503, error));
    }
}

async function cetakSlipGaji(req, res) {
    const { uid } = req.params;
    try {
        const dataSlipGaji = await Penggajian.db.findOne({
            where: { uid },
            include: [
                {
                    model: Pegawai.db,
                    attributes: ['nama']
                }
            ]
        });

        if (!dataSlipGaji) {
            return res.status(404).json(set_response(404, "Data slip gaji tidak ditemukan!"));
        }

        // Fungsi untuk memformat angka ke Rupiah
        const formatRupiah = (angka) => {
            return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(angka);
        };

        // Buat HTML template
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
        }
        .info {
            margin-bottom: 20px;
        }
        .info table {
            width: 100%;
            border-collapse: collapse;
        }
        .info td {
            padding: 5px 0;
        }
        .table-detail {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table-detail th, .table-detail td {
            border: 1px solid #333;
            padding: 8px 12px;
            text-align: left;
        }
        .table-detail th {
            background-color: #f2f2f2;
        }
        .total-row {
            font-weight: bold;
            background-color: #e6e6e6;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #555;
        }
        @media print {
            body { margin: 20px; }
            .no-print { display: none; }
            .table-detail th { background-color: #ddd !important; }
            .total-row { background-color: #ccc !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SLIP GAJI</h1>
        <p>Periode: ${dataSlipGaji.periode_bulan}/${dataSlipGaji.periode_tahun}</p>
    </div>

    <div class="info">
        <table>
            <tr><td style="width:150px;"><strong>ID Pegawai</strong></td><td>: ${dataSlipGaji.m_pegawai.nama}</td></tr>
            <tr><td><strong>UID Slip</strong></td><td>: ${dataSlipGaji.uid}</td></tr>
            <tr><td><strong>Tanggal Cetak</strong></td><td>: ${new Date().toLocaleDateString('id-ID')}</td></tr>
        </table>
    </div>

    <table class="table-detail">
        <thead>
            <tr>
                <th>Komponen</th>
                <th style="text-align:right;">Jumlah</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Gaji Pokok</td>
                <td style="text-align:right;">${formatRupiah(dataSlipGaji.total_gaji_pokok)}</td>
            </tr>
            <tr>
                <td>Insentif Transport</td>
                <td style="text-align:right;">${formatRupiah(dataSlipGaji.total_insentif_transport)}</td>
            </tr>
            <tr>
                <td>Insentif Makan</td>
                <td style="text-align:right;">${formatRupiah(dataSlipGaji.total_insentif_makan)}</td>
            </tr>
            <tr>
                <td>Insentif Lembur</td>
                <td style="text-align:right;">${formatRupiah(dataSlipGaji.total_insentif_lembur)}</td>
            </tr>
            <tr>
                <td>Potongan Terlambat</td>
                <td style="text-align:right; color:red;">(${formatRupiah(dataSlipGaji.total_potongan_terlambat)})</td>
            </tr>
            <tr>
                <td>Potongan BPJS</td>
                <td style="text-align:right; color:red;">(${formatRupiah(dataSlipGaji.total_potongan_bpjs)})</td>
            </tr>
            <tr>
                <td>Potongan TK</td>
                <td style="text-align:right; color:red;">(${formatRupiah(dataSlipGaji.total_potongan_tk)})</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Gaji Diterima</strong></td>
                <td style="text-align:right;"><strong>${formatRupiah(dataSlipGaji.total_gaji)}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Slip gaji ini dicetak secara otomatis dari sistem.</p>
        <p>Status: ${dataSlipGaji.status_closing ? 'Sudah Ditutup' : 'Belum Ditutup'}</p>
    </div>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
        `;

        // Kirim response dengan header HTML
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(htmlContent);

    } catch (error) {
        console.error(error);
        res.status(503).json(set_response(503, "gagal mencetak slip gaji"));
    }
}

module.exports = {
    getAll,
    calculatePayroll,
    closePayroll,
    viewSlipGaji,
    updatePenggajian,
    getByUid,
    cetakSlipGaji
};