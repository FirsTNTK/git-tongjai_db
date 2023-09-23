'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Bank extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Bank.hasMany(models.BankDetail, {
        foreignKey: 'bank_id', // ชื่อฟิลด์ที่เป็นคีย์นอกในตาราง BankDetail
        onDelete: 'CASCADE', // ระบุการลบ CASCADE
        onUpdate: 'CASCADE' // ระบุการอัปเดต CASCADE
      });
    }
  }
  Bank.init({
    bank_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account_no: DataTypes.INTEGER,
    account_code: DataTypes.INTEGER,
    bank_thumbnail: DataTypes.STRING,
    active: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Bank',
    timestamps: false,
    tableName: 'bank'
  });

  return Bank;
};







