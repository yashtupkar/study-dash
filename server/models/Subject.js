const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  topics: [{ type: String }]
});

module.exports = mongoose.model('Subject', SubjectSchema);
