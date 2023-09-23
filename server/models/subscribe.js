'use strict';
const {
  Model, DATE
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subscribe extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Subscribe.init({
    subscribe_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    subscribe_email: DataTypes.STRING,
    created_date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Subscribe',
    timestamps: false,
    tableName: 'subscribe'
  });
  return Subscribe;
};