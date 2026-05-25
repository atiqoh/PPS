module.exports = (app) => {
  app.get("/", async (req, res) => {
    res.json({
      message: "Halo",
    });
  });

  app.get("/dev/build", async (req, res) => {
    const db = require("./models/sync_db");
    db.sequelize.sync({ alter: true });
    res.json({
      message: "DB has been sync",
    });
  });

  app.use("/master/user", require("./routing/user.routes"));
  app.use("/master/hak_akses", require("./routing/hak_akses.routes"));
  app.use("/transaksi", require("./routing/transaksi.routes"));
  app.use(
    "/transaksi_penyesuaian",
    require("./routing/transaksi_penyesuaian.routes")
  );
  app.use("/satuan", require("./routing/satuan.routes"));
  app.use("/barang", require("./routing/barang.routes"));
  app.use("/laporan", require("./routing/laporan.routes"));
  app.use("/auth", require("./routing/auth.route"));

  return app;
};
