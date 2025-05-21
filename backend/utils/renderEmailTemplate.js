// utils/renderEmailTemplate.js
const fs = require('fs');
const path = require('path');

/**
 * Renders an HTML email template by replacing placeholders.
 * @param {string} templateName - The name of the HTML file in utils/emailTemplates (e.g., 'verificationEmail').
 * @param {object} data - An object containing key-value pairs for placeholders (e.g., { name: 'John', verificationCode: '123456' }).
 * @returns {string|null} The rendered HTML string, or null if the template is not found.
 */
const renderEmailTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, 'emailTemplates', `${templateName}.html`);
    if (!fs.existsSync(templatePath)) {
      console.error(`Email template not found: ${templatePath}`);
      return null;
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Add current year automatically
    const allData = { ...data, year: new Date().getFullYear() };

    // Replace placeholders like {{key}}
    for (const key in allData) {
      if (allData.hasOwnProperty(key)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, allData[key]);
      }
    }
    return htmlContent;
  } catch (error) {
    console.error(`Error rendering email template ${templateName}:`, error);
    return null; // Or throw error
  }
};

module.exports = { renderEmailTemplate };