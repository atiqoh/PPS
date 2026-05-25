const DataModel = require("../utils/data_model");
const { Sequelize } = require("../models/index");

class LoginHistory extends DataModel {
  constructor() {
    super();
    const db_field = {
      deviceid: {
        type: Sequelize.STRING,
      },
      token: {
        type: Sequelize.TEXT,
      },
    };

    this.set_db_field(db_field);
    this.set_db_name("t_login_history");
  }
}

module.exports = LoginHistory;
