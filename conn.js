require("dotenv").config();
const env = process.env;
const Sequelize = require("sequelize");

module.exports = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  dialect: env.DB_DIALECT,
  operatorAlias: false,
  port: env.DB_PORT || 3306,
  pool: {
    max: parseInt(env.DB_MAX_POOL),
    min: parseInt(env.DB_MIN_POOL),
    acquire: parseInt(env.DB_ACQUIRE_POOL),
    idle: parseInt(env.DB_IDLE_POOL),
  },
  timezone: "+07:00", // for writing to database
  // logging: console.log,
});
