module.exports = (app) => {
  app.get("/", async (req, res) => {
    res.json({
      message: "Halo",
    });
  });

  //endpoint untuk cek koneksi ke database 
  app.get("/db", async (req, res) => {
    const db = require("./models/sync_db");
    try {
      await db.sequelize.authenticate();
      res.json({
        message: "Koneksi ke database berhasil",
      });
    } catch (error) {
      res.status(500).json({
        message: "Koneksi ke database gagal",
        error: error.message,
      });
    }
  });

  app.get("/dev/build", async (req, res) => {
    const db = require("./models/sync_db");
    db.sequelize.sync({ alter: true });
    res.json({
      message: "DB has been sync",
    });
  });

  app.use("/auth", require("./routing/auth.route"));
  app.use("/pegawai", require("./routing/pegawai.routes"));
  app.use("/lembur", require("./routing/lembur.routes"));

  return app;
};
