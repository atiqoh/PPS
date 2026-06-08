const {Penggajian} = require("../models/sync_db");
const { set_response } = require("./page.controller");

async function getAll(req, res) {
    try {
        const datapenggajian = await Penggajian.db.findAll()
        res.json(set_response(200, "success get all payroll data", datapenggajian))
    } catch (error) {
        res.status(400).json(set_response(400, "cannot get all payroll data"))
    }
}

function calculatePayroll(req, res) {

}

module.exports = {
    getAll,
    calculatePayroll
};