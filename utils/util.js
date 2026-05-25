require("dotenv").config();
const jwt = require("jsonwebtoken");
const env = process.env;
const dayjs = require("dayjs");
const sprintf = require("sprintf-js").sprintf,
  vsprintf = require("sprintf-js").vsprintf;

exports.countDataFromQuery = async (sequelize, query = "") => {
  var count_data = await sequelize.query(query, {
    raw: false,
    plain: true,
  });
  return parseFloat(count_data.total);
};

exports.pickDataFromQuery = async (sequelize, query = "") => {
  var data = await sequelize.query(query, {
    raw: false,
    plain: true,
  });
  // nb: jika data tidak ditemukan hasilnya adalah null
  var pickdata = data ? data.data : null;
  return pickdata;
};

exports.getDataFromQuery = async (sequelize, query = "") => {
  try {
    var data = await sequelize.query(query, {
      raw: false,
      type: sequelize.SELECT,
    });
    return data[0];
  } catch (error) {
    return error;
  }
};

exports.execDataFromQuery = async (sequelize, query = "") => {
  var data = await sequelize
    .query(query, {
      raw: false,
    })
    .then((datanya) => {
      return {
        code: 200,
        message: "success execute",
        data: datanya,
      };
    })
    .catch((err) => {
      return {
        code: 500,
        message:
          err.message || "Some error occurred while updating the company.",
        data: null,
      };
    });

  return data;
};

exports.getDateDiff = async (start = "", end = "") => {
  let date1 = new Date(start);
  let date2 = new Date(end);

  let diff_time = date2.getTime() - date1.getTime();
  let diff_days = Math.round(diff_time / (1000 * 3600 * 24));

  return diff_days;
};

exports.connection = async (datacompany = "") => {
  var db = require("./models/db_dynamic")(datacompany);
  var sequelize = db.sequelize;
  return sequelize;
};

// Fungsi untuk membuat JWT dengan waktu kedaluwarsa
exports.generateToken = async (payload) => {
  if (parseInt(env.JWT_TIME) != 0) {
    // expiresIn dihitung dalam detik
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: parseInt(env.JWT_TIME),
    });
  } else {
    return jwt.sign(payload, env.JWT_SECRET);
  }
};

exports.verifyToken = (token) => {
  const decoded = jwt.verify(token, env.JWT_SECRET);

  // Get the current time in seconds
  if (parseInt(env.JWT_TIME) != 0) {
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;
    // Check if the token is expired
    if (currentTime >= expirationTime) {
      return { id: 0 };
    } else {
      return decoded;
    }
  } else {
    return decoded;
  }
};

exports.deleteDataByKey = (data, key) => {
  if (Array.isArray(key)) {
    key.map((val) => {
      delete data[val];
    });
  } else {
    delete data[key];
  }

  return data;
};

exports.removeByChar = (val = "", key, value) => {
  let valString = val.split(key);
  return (valString = valString.join(value || " "));
};

exports.isEmpty = (obj) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
};

exports.kodeAutoGenerate = async (
  tbl = "",
  prefix = "",
  digits = 4,
  column = "kode"
) => {
  let date = dayjs();
  let year = date.format("YY");
  let month = date.format("MM");
  let format_code = `${[prefix]}/${year}/${month}/`;
  const query = `SELECT count(*) as total FROM ${tbl} WHERE ${column} like '${format_code}%'`;

  const { Sequelize, sequelize } = require("../models/sync_db");

  let countData = await this.getDataFromQuery(sequelize, query).then((row) => {
    return row[0].total;
  });
  let no = sprintf(`%0${digits}d`, parseInt(countData) + 1);
  return format_code + no;
};
