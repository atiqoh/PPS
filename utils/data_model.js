const { Sequelize, sequelize } = require("../models/index");
const { getDataFromQuery } = require("../utils/util");

class DataModel {
  constructor() {
    this.db_field = {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        unique: true,
      },
      uid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        unique: true,
      },
      aktif: {
        type: Sequelize.INTEGER,
      },
    };
    this.db_name = "";
    this.softdelete = true;
    this.relation = [];
    this.query = "";
  }

  set_db_field(db_field) {
    this.db_field = { ...this.db_field, ...db_field };
    return this.db_field;
  }

  set_db_name(db_name) {
    this.db_name = db_name;
    return this.db_name;
  }

  set_softdelete(softdelete) {
    this.softdelete = softdelete;
    return this.softdelete;
  }

  db_sync() {
    if (this.db_name == "") {
      console.log("Nama table belum di buat");
      return false;
    }
    const db = sequelize.define(this.db_name, this.db_field, {
      tableName: this.db_name,
      createdAt: "created_at",
      updatedAt: "updated_at",
      deletedAt: "delete_at",
      paranoid: this.softdelete,
      timestamps: true,
    });
    const obj = {};
    obj.db = db;
    obj.cls = this;
    if (this.relation.length != 0) {
      this.relation.map((val) => {
        let table_relation = val.relation_table.db_sync().db;
        if (val.relation == "has_one") {
          let foreignKeyName = val.relation_table.db_name + "_id";
          if (typeof val.relation_name != undefined) {
            foreignKeyName = val.relation_name;
          }

          obj.db.belongsTo(table_relation, {
            foreignKey: foreignKeyName,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          });
        } else if (val.relation == "has_many") {
          let foreignKeyName = val.relation_table.db_name + "_id";
          if (typeof val.relation_name != undefined) {
            foreignKeyName = val.relation_name;
          }

          obj.db.belongsTo(table_relation, {
            foreignKey: foreignKeyName,
          });
        }
      });
    }
    return obj;
  }

  set_relation(relation) {
    return (this.relation = relation);
  }

  get_all_field() {
    let all_field = [];
    for (var key in this.db_field) {
      all_field.push(`${this.db_name}.${key}`);
    }
    return all_field;
  }

  async get(params) {
    // join example
    // join : [
    //   {
    //     table: "m_hak_akses ha", (nama table yang mau di join)
    //     on: "ha.id = m_user.hak_akses_id", (parameter yang di join)
    //     type: "inner", (inner, left, right)
    //   },
    // ],
    // where: "m_user.id != 0" atau ["m_user.id != 0"], (bisa berupa array maupun string biasa)
    // limit: 1, (string maupun integer sama saja)
    // offset: 1, (string maupun integer sama saja)
    // order_by: "id asc" atau ["id asc"], (bisa berupa array maupun string biasa)
    // group_by: "id" atau ["id"], (bisa berupa array maupun string biasa)

    let paramsWhere = params.where || [];
    let where = paramsWhere;
    if (!Array.isArray(paramsWhere)) {
      where = [paramsWhere];
    }

    if (where.length > 0) {
      for (var key in where) {
        where[key] = `(${where[key]})`;
      }
      where = `where ${where.join(" and ")}`;
    }

    let paramsJoin = params.join || [];
    let join = "";

    if (paramsJoin.length > 0) {
      paramsJoin.map((val, index) => {
        join += `${val.type || "left"} join ${val.table} on ${val.on}`;
      });
    }

    let paramsLimit = params.limit || "";
    let limit = paramsLimit != "" ? `limit ${paramsLimit}` : "";

    let paramsOffset = params.offset || "";
    let offset = paramsOffset != "" ? `offset ${paramsOffset}` : "";

    let paramsOrderBy = params.order_by || [];
    let order_by = paramsOrderBy;
    if (!Array.isArray(paramsOrderBy)) {
      order_by = [paramsOrderBy];
    }

    if (order_by.length > 0) {
      order_by = `order by ${order_by.join(", ")}`;
    }

    let paramsGroupBy = params.group_by || [];
    let group_by = paramsGroupBy;
    if (!Array.isArray(paramsGroupBy)) {
      group_by = [paramsGroupBy];
    }

    if (group_by.length > 0) {
      group_by = `group by ${group_by.join(", ")}`;
    }

    let default_select = `DISTINCT ${this.get_all_field().join(", ")}`;

    this.query = `select ${params.select || default_select} from ${this.db_name} ${join} ${where} ${group_by} ${order_by} ${limit} ${offset}`;
    return await getDataFromQuery(sequelize, this.query);
  }
}

module.exports = DataModel;
