import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import { protect } from './middleware/authMiddleware.js';

// Load .env variables FIRST — before any process.env access
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fail fast if the URI is missing — better than a cryptic Mongoose error
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Add it to backend/.env');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: [
    'https://biiling-stock-mangement-9wfj.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(bodyParser.json());
app.use(express.json());

// Auth Routes
app.use('/api/auth', authRoutes);

// Protect all business routes
app.use('/api/products', protect);
app.use('/api/bills', protect);
app.use('/api/dashboard', protect);

// Mongoose 8+ no longer accepts useNewUrlParser / useUnifiedTopology
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected successfully'))
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1); // Don't silently run with no DB
  });

// Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  units: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Bill Schema
const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceDue: {
    type: Number,
    default: function() {
      return this.totalAmount - (this.amountPaid || 0);
    },
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'partial'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'credit'],
    default: 'cash'
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
const Bill = mongoose.model('Bill', billSchema);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎉 Billing & Stock Management API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products',
      bills: '/api/bills',
      dashboard: '/api/dashboard/stats'
    },
    version: '1.0.0'
  });
});

// Product Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bill Routes

// Get all bills
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find().populate('items.productId').sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single bill
app.get('/api/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('items.productId');
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create bill
app.post('/api/bills', async (req, res) => {
  try {
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const billData = {
      ...req.body,
      billNumber
    };
    const bill = new Bill(billData);
    const savedBill = await bill.save();
    // Update product units after sale
    for (const item of savedBill.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { units: -item.quantity } }
      );
    }
    const populatedBill = await Bill.findById(savedBill._id).populate('items.productId');
    res.status(201).json(populatedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update bill
app.put('/api/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('items.productId');
    
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete bill — restores product stock before removing the bill
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Restore inventory for every line item on this bill
    for (const item of bill.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { units: item.quantity } } // give stock back
      );
    }

    await bill.deleteOne();
    res.json({ message: 'Bill deleted and stock restored successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalBills = await Bill.countDocuments();
    const totalRevenue = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const lowStockProducts = await Product.countDocuments({ units: { $lt: 10 } });
    
    res.json({
      totalProducts,
      totalBills,
      totalRevenue: totalRevenue[0]?.total || 0,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});