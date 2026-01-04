const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  grade: {
    type: String,
    index: true
  },
  license_number: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  validity_date: {
    type: String,
    index: true
  },
  issue_date: {
    type: String
  },
  phone: {
    type: String,
    index: true
  },
  mobile: {
    type: String,
    index: true
  },
  address: {
    type: String,
    index: true
  },
  extraction_method: {
    type: String
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
lawyerSchema.index({ name: 1, mobile: 1 });
lawyerSchema.index({ name: 1, license_number: 1 });
lawyerSchema.index({ mobile: 1, license_number: 1 });

module.exports = mongoose.model('Lawyer', lawyerSchema);
