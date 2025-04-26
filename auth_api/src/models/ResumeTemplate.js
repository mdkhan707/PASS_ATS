const { text } = require('express');
const mongoose = require('mongoose');

const ResumeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  pdfUrl: { type: String, required: true },
  imageUrl: { type: String, required: true }, // ✅ Add this line
  templaeName: { type: String, required: true }, // ✅ Add this line
});

const ResumeTemplate = mongoose.model('ResumeTemplate', ResumeTemplateSchema);

module.exports = ResumeTemplate;


// MongoDB Schema for saving templateId
const userSchema = new mongoose.Schema({
  userId: String, // You'll need user authentication for this
  selectedTemplateId: String,
});

const User = mongoose.model('Saved_Template', userSchema);
