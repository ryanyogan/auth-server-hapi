const mongoose = require('mongoose');

const BeerSchema = new mongoose.Schema({
  name: String,
  type: String,
  quantity: Number
});

module.exports = mongoose.model('Beer', BeerSchema);
