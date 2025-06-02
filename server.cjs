const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for both local and production
app.use(cors({
  origin: [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, 'http://localhost:5173']
}));
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    const { data, error } = await resend.emails.send({
      from: 'Newsletter <info@williamtreygreen.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Resend API error:', error);
      return res.status(400).json({ error });
    }

    return res.status(200).json({ data });
  } catch (error) {
    // console.error('Server error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;