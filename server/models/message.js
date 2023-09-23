'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Message.init({
    msg_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: DataTypes.STRING,
    company: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.INTEGER,
    subject: DataTypes.STRING,
    message: DataTypes.STRING,
    remark: DataTypes.STRING,
    created_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Message',
    timestamps: false,
    tableName: 'message'
  });
  return Message;
};