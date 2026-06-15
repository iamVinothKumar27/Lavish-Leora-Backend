const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const adminAuth = require('../middleware/adminAuth');

// POST /api/contacts — submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    const contact = await Contact.create({ name, email, phone, message });

    // Send email if SMTP credentials are configured
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"Lavish Leora Contact" <${process.env.SMTP_USER}>`,
          to: process.env.CONTACT_DESTINATION_EMAIL || 'lavishleora@gmail.com',
          replyTo: email,
          subject: `New message from ${name} — Lavish Leora`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
          html: `<h2>New Contact Message — Lavish Leora</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><hr><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
        });
        console.log(`[Contact] Email sent to ${process.env.CONTACT_DESTINATION_EMAIL || 'lavishleora@gmail.com'}`);
      } catch (emailErr) {
        console.error('[Contact] Email send failed (message still saved):', emailErr.message);
      }
    }

    res.status(201).json({ message: 'Your message has been received. We will contact you soon!', id: contact._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET /api/contacts — admin: list all messages
router.get('/', adminAuth, async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/contacts/:id/read — admin: mark as read
router.put('/:id/read', adminAuth, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.json(contact);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/contacts/:id — admin: delete message
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
