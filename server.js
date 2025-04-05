require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
console.log("🔍 MONGODB_URI =", process.env.MONGODB_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Models
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['teacher', 'admin'], default: 'teacher' }
}));

const Leave = mongoose.model('Leave', new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: Date,
  endDate: Date,
  reason: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}));

// Auth Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: 'Please authenticate' });
  }
};

// Routes
app.post('/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ 
      ...req.body, 
      password: hashedPassword 
    });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'SECRET_KEY');
    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user || !await bcrypt.compare(req.body.password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'SECRET_KEY');
    res.send({ 
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token 
    });
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

app.get('/leave', auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ teacherId: req.user.id });
    res.send(leaves);
  } catch (err) {
    res.status(500).send({ error: 'Error fetching leaves', details: err.message });
  }
});

app.post('/leave', auth, async (req, res) => {
  try {
    const leave = await Leave.create({
      teacherId: req.user.id,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason
    });
    res.status(201).send(leave);
  } catch (err) {
    res.status(400).send({ error: 'Error creating leave request', details: err.message });
  }
});

app.get('/leave-report/:teacherId', auth, async (req, res) => {
  try {
    const teacher = await User.findById(req.params.teacherId);
    const leaves = await Leave.find({ teacherId: req.params.teacherId });

    if (!teacher) {
      return res.status(404).send({ error: 'Teacher not found' });
    }

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="leave-report-${teacher.name}.pdf"`);

    doc.pipe(res);
    doc.fontSize(20).text(`Leave Report for ${teacher.name}`, { align: 'center' });
    doc.moveDown();

    leaves.forEach(leave => {
      doc.fontSize(12)
         .text(`From: ${new Date(leave.startDate).toDateString()}`)
         .text(`To: ${new Date(leave.endDate).toDateString()}`)
         .text(`Reason: ${leave.reason}`)
         .text(`Status: ${leave.status}`)
         .moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).send({ error: 'Error generating PDF', details: err.message });
  }
});

// Start Server
const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();