// Mock API functions that work with user-specific localStorage data
// This replaces the external API calls with local data operations

import { 
  getUserProducts, setUserProducts, 
  getUserBills, setUserBills, 
  updateUserStats, getCurrentUser,
  getUserData, setUserData, DATA_TYPES
} from './userManager';

// Base API configuration
const API_DELAY = 300; // Simulate network delay

// Helper function to simulate API response delay
const simulateDelay = (ms = API_DELAY) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Generate unique IDs

const getNextProductId = (userId) => {
  const products = getUserProducts(userId);
  const maxId = products.reduce((max, product) => {
    const numId = parseInt(product.id) || 0;
    return numId > max ? numId : max;
  }, 0);
  return (maxId + 1).toString();
};

const getNextBillId = (userId) => {
  const bills = getUserBills(userId);
  const maxId = bills.reduce((max, bill) => {
    const numId = parseInt(bill.id) || 0;
    return numId > max ? numId : max;
  }, 0);
  return (maxId + 1).toString();
};

// Products API functions
export const productsApi = {
  // Get all products for current user
  getAll: async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    return getUserProducts(currentUser.id);
  },

  // Get single product
  getById: async (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const product = products.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  },

  // Create new product
  create: async (productData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const newProduct = {
      ...productData,
      id: getNextProductId(currentUser.id),
      price: Number(productData.price), // Ensure price is a number
      units: Number(productData.units), // Ensure units is a number
      weight: Number(productData.weight), // Ensure weight is a number
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedProducts = [...products, newProduct];
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    
    return newProduct;
  },

  // Update existing product
  update: async (id, productData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) throw new Error('Product not found');
    
    const updatedProduct = {
      ...products[productIndex],
      ...productData,
      id: id, // Ensure ID doesn't change
      price: Number(productData.price), // Ensure price is a number
      units: Number(productData.units), // Ensure units is a number
      weight: Number(productData.weight), // Ensure weight is a number
      updatedAt: new Date().toISOString()
    };
    
    const updatedProducts = [...products];
    updatedProducts[productIndex] = updatedProduct;
    
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    
    return updatedProduct;
  },

  // Delete product
  delete: async (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const updatedProducts = products.filter(p => p.id !== id);
    
    if (products.length === updatedProducts.length) {
      throw new Error('Product not found');
    }
    
    setUserProducts(currentUser.id, updatedProducts);
    updateUserStats(currentUser.id);
    
    return { message: 'Product deleted successfully' };
  }
};

// Bills API functions
export const billsApi = {
  // Get all bills for current user
  getAll: async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    return getUserBills(currentUser.id);
  },

  // Get single bill
  getById: async (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const bill = bills.find(b => b.id === id);
    if (!bill) throw new Error('Bill not found');
    return bill;
  },

  // Create new bill
  create: async (billData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const products = getUserProducts(currentUser.id);
    
    // Generate bill number
    const billNumber = `BILL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newBill = {
      ...billData,
      id: getNextBillId(currentUser.id),
      billNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Update product quantities
    if (billData.items && billData.items.length > 0) {
      const updatedProducts = products.map(product => {
        const billItem = billData.items.find(item => item.productId === product.id);
        if (billItem) {
          return {
            ...product,
            units: Math.max(0, (product.units || 0) - billItem.quantity)
          };
        }
        return product;
      });
      
      setUserProducts(currentUser.id, updatedProducts);
    }
    
    const updatedBills = [...bills, newBill];
    setUserBills(currentUser.id, updatedBills);
    updateUserStats(currentUser.id);
    
    return newBill;
  },

  // Update existing bill
  update: async (id, billData) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    
    // For bill updates, we need to find the bill in the correct user's data
    // Get all bills to find who owns this bill
    const bills = getUserBills(currentUser.id);
    const bill = bills.find(b => b.id === id);
    
    if (!bill) throw new Error('Bill not found');
    
    // Get the original creator's bills to update
    const creatorId = bill.createdById || currentUser.id;
    const creatorBills = getUserData(creatorId, DATA_TYPES.BILLS);
    const billIndex = creatorBills.findIndex(b => b.id === id);
    
    if (billIndex === -1) throw new Error('Bill not found');
    
    const updatedBill = {
      ...creatorBills[billIndex],
      ...billData,
      id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    const updatedBills = [...creatorBills];
    updatedBills[billIndex] = updatedBill;
    
    setUserData(creatorId, DATA_TYPES.BILLS, updatedBills);
    updateUserStats(currentUser.id);
    
    return updatedBill;
  },

  // Delete bill
  delete: async (id) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const bills = getUserBills(currentUser.id);
    const updatedBills = bills.filter(b => b.id !== id);
    
    if (bills.length === updatedBills.length) {
      throw new Error('Bill not found');
    }
    
    setUserBills(currentUser.id, updatedBills);
    updateUserStats(currentUser.id);
    
    return { message: 'Bill deleted successfully' };
  }
};

// Dashboard/Stats API functions
export const statsApi = {
  // Get dashboard statistics
  get: async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');
    
    await simulateDelay();
    const products = getUserProducts(currentUser.id);
    const bills = getUserBills(currentUser.id);
    
    const stats = {
      totalProducts: products.length,
      totalBills: bills.length,
      totalRevenue: bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0),
      lowStockProducts: products.filter(p => (p.units || 0) < 10).length
    };
    
    return stats;
  }
};

// General API wrapper that matches the original API structure
export const mockApi = {
  products: productsApi,
  bills: billsApi,
  stats: statsApi
};
