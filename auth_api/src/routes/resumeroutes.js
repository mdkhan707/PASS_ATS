const express = require('express');
const router = express.Router();
const { insertTemplates, getAllTemplates } = require('../controllers/resumecontroller');

// Route to insert templates (for testing purposes)
router.get('/insert-templates', (req, res) => {
  insertTemplates();
  res.send('Templates inserted!');
});

// Route to fetch all resume templates
router.get('/resume-templates', getAllTemplates);

module.exports = router;
