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
      autoIncrement: true
    },
    language: {
      type: DataTypes.STRING,
      primaryKey: true,
      defaultValue: ''
    },
    bank_name: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    bank_branch: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    account_name: {
      type: DataTypes.STRING,
      defaultValue: ''
    },

  }, {
    sequelize,
    modelName: 'BankDetail',
    timestamps: false,
    tableName: 'bank_detail'
  });

  return BankDetail;
};
