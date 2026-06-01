const DataModel = require("../utils/data_model");
const { Sequelize } = require("./index");

class SettingGlobal extends DataModel {
  constructor() {
    super();

    const db_field = {
      potongan_terlambat_per_hari: {
        type: Sequelize.DOUBLE(11, 2),
      },
      insentif_terlambat_per_jam: {
        type: Sequelize.DOUBLE(11, 2),
      },
      jam_masuk: {
        type: Sequelize.TIME,
      },
      radius_gps: {
        type: Sequelize.INTEGER,
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("m_setting_global");
  }
}

module.exports = SettingGlobal;
