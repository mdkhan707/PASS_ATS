const ResumeTemplate = require('../models/ResumeTemplate');


// Function to insert resume templates
const insertTemplates = async () => {
  const templates = [
        {
          name: 'Professional Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922530/5_c2jr9e.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922530/5_c2jr9e.jpg',
        },
        {
          name: 'Creative Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/6_zpwoyp.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/6_zpwoyp.jpg',
        },
        {
          name: 'Minimal Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/4_s0itql.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/4_s0itql.jpg',
        },
        {
          name: 'Executive Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/3_y8ijbk.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922529/3_y8ijbk.jpg',
        },
        {
          name: 'Tech Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922528/2_lmtohn.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922528/2_lmtohn.jpg',
        },
        {
          name: 'Designer Resume Template',
          pdfUrl: 'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922478/1_tsh0gr.pdf',
          imageUrl:'https://res.cloudinary.com/dp7kquhkc/image/upload/v1743922478/1_tsh0gr.jpg',
        }
  ];
  // Insert each template into the database
  try {
    for (const templateData of templates) {
      const template = new ResumeTemplate(templateData);
      await template.save();
      console.log(`${templateData.name} template saved.`);
    }
  } catch (err) {
    console.error('Error saving templates:', err);
  }
};

// Function to get all resume templates
const getAllTemplates = async (req, res) => {
  try {
    const templates = await ResumeTemplate.find();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resume templates' });
  }
};

module.exports = { insertTemplates, getAllTemplates };

