const Template = require("../models/template_model");

const getAllTemplates = async (req, res) => { try { const templates = await Template.find(); res.json(templates); } catch (err) { res.status(500).json({ error: "Failed to fetch templates" }); } };

module.exports = { getAllTemplates, };