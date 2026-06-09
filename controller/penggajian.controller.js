const { Op } = require("sequelize");
const { Penggajian, Absensi } = require("../models/sync_db");
const { set_response } = require("./page.controller");

async function getAll(req, res) {
    try {
        const datapenggajian = await Penggajian.db.findAll()
        res.json(set_response(200, "success get all payroll data", datapenggajian))
    } catch (error) {
        res.status(400).json(set_response(400, "cannot get all payroll data"))
    }
}

async function calculatePayroll(req, res) {
    const { periode_bulan, periode_tahun } = req.body;
    try {
        const payroll_periods = await Penggajian.db.findAll({
            where: {
                periode_bulan,
                periode_tahun
            }
        });
        (payroll_periods.length) ?
            res.json(set_response(200, "success get all payroll list", payroll_periods))
            : res.status(400).json(set_response(400, "no data found"));
    } catch (error) {
        res.status(400).json(set_response(400, "cannot get all payroll list"))
    } finally {

    }
}

async function closePayroll(req, res) {
    const { periode_bulan, periode_tahun } = req.body;
    const startDate = new Date(periode_tahun, periode_bulan, -1, 1);
    const endDate = new Date(periode_tahun, periode_bulan, 0);
    try {
        const checkPendingAbsensi = await Absensi.db.findOne({
            where: {
                status: "pending",
                tanggal: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                }
            }
        });
        if (checkPendingAbsensi) res.json(set_response(200, "success get pending absensi", checkPendingAbsensi));
        else res.status(400).json(set_response(400, "no pending absensi"));
    } catch (error) {
        res.status(400).json(set_response(400, "cannot get pending absensi"));
    }
}

module.exports = {
    getAll,
    calculatePayroll,
    closePayroll
};