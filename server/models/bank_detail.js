'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BankDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      BankDetail.belongsTo(models.Bank, {
        foreignKey: 'bank_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  BankDetail.init({
    bank_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Bank', // ระบุตารางที่ต้องการเชื่อมโยง
        key: 'bank_id' // ระบุฟิลด์ที่เป็นคีย์นอก
      },
      onDelete: 'CASCADE', // ระบุการลบ CASCADE
      onUpdate: 'CASCADE' // ระบุการอัปเดต CASCADE
    },
    language: DataTypes.STRING,
    bank_name: DataTypes.STRING,
    bank_branch: DataTypes.STRING,
    account_name: DataTypes.STRING,
    active: {
      type: DataTypes.INTEGER
    },
  }, {
    sequelize,
    modelName: 'BankDetail',
    timestamps: false,
    tableName: 'bank_detail'
  });

  return BankDetail;
};
