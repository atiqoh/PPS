const Sequelize = require("sequelize");
const connection = require("../conn");
const db = {};
db.Sequelize = Sequelize; // untuk all fungsi Sequelize
db.sequelize = connection; // untuk koneksi db
module.exports = db;
