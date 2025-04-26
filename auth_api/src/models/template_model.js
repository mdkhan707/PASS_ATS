const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({ name: String, pngUrl: String, pdfUrl: String });

module.exports = mongoose.model("Template", templateSchema);
