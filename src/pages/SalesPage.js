import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ReceiptRefundIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PrinterIcon,
  EyeIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : 'https://inventory-api-m7d5.onrender.com/api';
};

const SalesPage = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_revenue: 0,
    average_sale: 0,
    today_revenue: 0,
    today_sales: 0
  });
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showSaleDetailModal, setShowSaleDetailModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showCompletePendingModal, setShowCompletePendingModal] = useState(false);
  const [saleToComplete, setSaleToComplete] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  
  // New sale state
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    amountPaid: '',
    discount: '0',
    taxRate: '8',
    notes: ''
  });

  const fetchSales = async (page = pagination.page) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit
      };
      if (filter !== 'all') params.status = filter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await axios.get(`${getApiBaseUrl()}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      });
      
      setSales(response.data.sales || []);
      
      // Update pagination
      if (response.data) {
        setPagination({
          page: response.data.page || 1,
          limit: response.data.limit || 20,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1
        });
      }
      
      // Set REAL stats from backend
      if (response.data.summary) {
        setStats({
          total_revenue: response.data.summary.total_revenue || 0,
          average_sale: response.data.summary.average_sale || 0,
          today_revenue: response.data.summary.today_revenue || 0,
          today_sales: response.data.summary.today_sales || 0,
          total_sales: response.data.summary.total_sales || 0
        });
      }
    } catch (error) {
      console.error('Fetch sales error:', error);
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: { limit: 100, status: 'active' }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('Failed to fetch products');
    }
  };

  useEffect(() => {
    fetchSales(1);
    fetchProducts();
  }, [filter, dateRange]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      refunded: { color: 'bg-purple-100 text-purple-800', icon: ReceiptRefundIcon }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: ClockIcon };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (method) => {
    const methods = {
      cash: 'bg-blue-100 text-blue-800',
      card: 'bg-purple-100 text-purple-800',
      online: 'bg-green-100 text-green-800',
      credit: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${methods[method] || 'bg-gray-100 text-gray-800'}`}>
        {method.charAt(0).toUpperCase() + method.slice(1)}
      </span>
    );
  };

  const handleCancelSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to cancel this sale? Stock will be restored.')) return;
    
    try {
      await axios.put(`${getApiBaseUrl()}/sales/${saleId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Sale cancelled successfully');
      fetchSales(pagination.page);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel sale');
    }
  };

  const handleRefundSale = async (saleId) => {
    if (!window.confirm('Are you sure you want to refund this sale? Stock will be restored.')) return;
    
    try {
      await axios.put(`${getApiBaseUrl()}/sales/${saleId}/refund`, {
        notes: 'Refund requested by user'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Sale refunded successfully');
      fetchSales(pagination.page);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to refund sale');
    }
  };

  const handleCompletePendingSale = async () => {
    if (!saleToComplete) return;
    
    const remainingAmount = saleToComplete.final_amount - saleToComplete.amount_paid;
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    if (parseFloat(paymentAmount) < remainingAmount) {
      toast.error(`Amount must be at least ₹${remainingAmount.toFixed(2)} to complete this sale`);
      return;
    }
    
    try {
      const response = await axios.put(`${getApiBaseUrl()}/sales/${saleToComplete.id}/complete`, {
        amount_paid: parseFloat(paymentAmount),
        payment_method: saleToComplete.payment_method
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('Sale completed successfully!');
      setShowCompletePendingModal(false);
      setSaleToComplete(null);
      setPaymentAmount('');
      
      // Refresh data
      fetchSales(pagination.page);
      fetchProducts();
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete sale');
    }
  };

  // New Sale Functions
  const addToCart = (product) => {
    if (product.current_stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.current_stock) {
        toast.error(`Only ${product.current_stock} units available`);
        return;
      }
      setCartItems(cartItems.map(item =>
        item.product_id === product.id
          ? { 
              ...item, 
              quantity: item.quantity + 1,
              total_price: (item.unit_price * (item.quantity + 1)).toFixed(2)
            }
          : item
      ));
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: parseFloat(product.selling_price),
          quantity: 1,
          total_price: parseFloat(product.selling_price).toFixed(2),
          current_stock: product.current_stock
        }
      ]);
    }
    
    toast.success(`${product.name} added to cart`);
    setSearchProduct('');
  };

  const removeFromCart = (index) => {
    const newCart = [...cartItems];
    newCart.splice(index, 1);
    setCartItems(newCart);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity < 1) {
      removeFromCart(index);
      return;
    }
    
    const newCart = [...cartItems];
    const item = newCart[index];
    
    if (quantity > item.current_stock) {
      toast.error(`Only ${item.current_stock} units available`);
      return;
    }
    
    item.quantity = parseInt(quantity);
    item.total_price = (item.unit_price * quantity).toFixed(2);
    setCartItems(newCart);
  };

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.total_price) || 0);
    }, 0);
    
    const discount = parseFloat(paymentInfo.discount) || 0;
    const taxRate = parseFloat(paymentInfo.taxRate) || 8;
    const taxAmount = (subtotal - discount) * (taxRate / 100);
    const total = subtotal - discount + taxAmount;
    const amountPaid = parseFloat(paymentInfo.amountPaid) || 0;
    const change = Math.max(amountPaid - total, 0);
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      tax: parseFloat(taxAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      amountPaid: parseFloat(amountPaid.toFixed(2))
    };
  };

  const handleProcessSale = async () => {
    if (cartItems.length === 0) {
      toast.error('Please add items to cart');
      return;
    }
    
    const totals = calculateTotals();
    const amountPaid = parseFloat(paymentInfo.amountPaid) || 0;
    
    if (amountPaid < 0) {
      toast.error('Amount paid cannot be negative');
      return;
    }
    
    try {
      const saleData = {
        customer_name: customerInfo.name || null,
        customer_email: customerInfo.email || null,
        customer_phone: customerInfo.phone || null,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        })),
        discount_amount: totals.discount,
        tax_amount: totals.tax,
        amount_paid: amountPaid,
        payment_method: paymentInfo.method,
        notes: paymentInfo.notes || null,
        calculate_tax: true,
        tax_rate: paymentInfo.taxRate
      };
      
      const response = await axios.post(`${getApiBaseUrl()}/sales`, saleData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (amountPaid >= totals.total) {
        toast.success('Sale completed successfully!');
      } else {
        toast.success('Sale created as pending!');
      }
      
      console.log('Invoice:', response.data.data.invoice_number);
      
      // Reset form
      setCartItems([]);
      setCustomerInfo({ name: '', email: '', phone: '' });
      setPaymentInfo({
        method: 'cash',
        amountPaid: '',
        discount: '0',
        taxRate: '8',
        notes: ''
      });
      setShowNewSaleModal(false);
      
      // Fetch updated data
      fetchSales(1);
      fetchProducts();
      
    } catch (error) {
      console.error('Process sale error:', error);
      toast.error(error.response?.data?.message || 'Failed to process sale');
    }
  };

  const handleViewSale = async (sale) => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/sales/${sale.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSelectedSale(response.data.data);
      setShowSaleDetailModal(true);
    } catch (error) {
      toast.error('Failed to load sale details');
    }
  };

  const printReceipt = (sale) => {
    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Receipt - ${sale.invoice_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .info { margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; text-align: right; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
            .pending { color: #f59e0b; font-weight: bold; }
            .completed { color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>INVOICE RECEIPT</h2>
            <h3>${sale.invoice_number}</h3>
            <p class="${sale.status === 'completed' ? 'completed' : 'pending'}">
              Status: ${sale.status.toUpperCase()}
            </p>
          </div>
          <div class="info">
            <p><strong>Date:</strong> ${new Date(sale.created_at).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${sale.customer_name || 'Walk-in Customer'}</p>
            <p><strong>Sold By:</strong> ${sale.sold_by_name || user?.name}</p>
            <p><strong>Payment Method:</strong> ${sale.payment_method?.toUpperCase()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items?.map(item => `
                <tr>
                  <td>${item.product_name || 'Unknown Product'}</td>
                  <td>${item.quantity}</td>
                  <td>₹${parseFloat(item.unit_price || 0).toFixed(2)}</td>
                  <td>₹${parseFloat(item.total_price || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            <p>Subtotal: ₹${parseFloat(sale.total_amount || 0).toFixed(2)}</p>
            <p>Discount: ₹${parseFloat(sale.discount_amount || 0).toFixed(2)}</p>
            <p>Tax: ₹${parseFloat(sale.tax_amount || 0).toFixed(2)}</p>
            <p><strong>Total: ₹${parseFloat(sale.final_amount || 0).toFixed(2)}</strong></p>
            <p>Amount Paid: ₹${parseFloat(sale.amount_paid || 0).toFixed(2)}</p>
            ${sale.change_amount > 0 ? `<p>Change: ₹${parseFloat(sale.change_amount || 0).toFixed(2)}</p>` : ''}
            ${sale.status === 'pending' ? `<p class="pending">Balance Due: ₹${(sale.final_amount - sale.amount_paid).toFixed(2)}</p>` : ''}
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const totals = calculateTotals();

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSales(newPage);
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md ${
            i === pagination.page
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span> of{' '}
              <span className="font-medium">{pagination.total}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">First</span>
                <ChevronLeftIcon className="h-4 w-4" />
                <ChevronLeftIcon className="h-4 w-4 -ml-2" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              {pages}
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Last</span>
                <ChevronRightIcon className="h-4 w-4" />
                <ChevronRightIcon className="h-4 w-4 -ml-2" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 mt-1">Manage sales transactions</p>
            </div>
            <button
              onClick={() => setShowNewSaleModal(true)}
              className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Sale
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Date Range */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
              >
                <option value="all">All Sales</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sales Stats - REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { 
              label: 'Today\'s Revenue', 
              value: `₹${parseFloat(stats.today_revenue || 0).toFixed(2)}`,
              color: 'bg-gradient-to-r from-green-500 to-emerald-600',
              icon: CurrencyDollarIcon,
              realData: true
            },
            { 
              label: 'Total Sales', 
              value: stats.total_sales || 0,
              color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
              icon: ShoppingCartIcon,
              realData: true
            },
            { 
              label: 'Average Sale', 
              value: `₹${parseFloat(stats.average_sale || 0).toFixed(2)}`,
              color: 'bg-gradient-to-r from-purple-500 to-pink-600',
              icon: CurrencyDollarIcon,
              realData: true
            },
            { 
              label: 'Today\'s Sales', 
              value: stats.today_sales || 0,
              color: 'bg-gradient-to-r from-yellow-500 to-orange-600',
              icon: CheckCircleIcon,
              realData: true
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.realData ? 'Real-time data' : 'Sample data'}
                    </p>
                  </div>
                  <div className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-600 mb-6">Create your first sale to get started.</p>
              <button
                onClick={() => setShowNewSaleModal(true)}
                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Sale
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.map((sale) => {
                      const balanceDue = sale.final_amount - sale.amount_paid;
                      const isPending = sale.status === 'pending';
                      
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 font-mono">
                              {sale.invoice_number}
                            </div>
                            <div className="text-xs text-gray-500">
                              Items: {sale.items_count || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <UserIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {sale.customer_name || 'Walk-in Customer'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {sale.customer_phone || 'No phone'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(sale.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">
                              ₹{parseFloat(sale.final_amount || 0).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Paid: ₹{parseFloat(sale.amount_paid || 0).toFixed(2)}
                              {isPending && (
                                <div className="text-yellow-600 font-medium">
                                  Due: ₹{balanceDue.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getPaymentBadge(sale.payment_method)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(sale.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewSale(sale)}
                                className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                title="View Details"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => printReceipt(sale)}
                                className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                                title="Print Receipt"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </button>
                              {sale.status === 'pending' && (
                                <button
                                  onClick={() => {
                                    setSaleToComplete(sale);
                                    setPaymentAmount(balanceDue.toFixed(2));
                                    setShowCompletePendingModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                  title="Complete Sale"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              {sale.status === 'completed' && (
                                <>
                                  <button
                                    onClick={() => handleCancelSale(sale.id)}
                                    className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded-lg transition-colors duration-200"
                                    title="Cancel Sale"
                                  >
                                    <XCircleIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRefundSale(sale.id)}
                                    className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-lg transition-colors duration-200"
                                    title="Refund Sale"
                                  >
                                    <ReceiptRefundIcon className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>

        {/* New Sale Modal */}
        {showNewSaleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">New Sale</h2>
                  <button
                    onClick={() => setShowNewSaleModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Products */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
                      <div className="relative mb-4">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search products by name or SKU..."
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {searchProduct && (
                        <div className="bg-white rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                          {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No products found
                            </div>
                          ) : (
                            filteredProducts.map(product => (
                              <div
                                key={product.id}
                                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                onClick={() => addToCart(product)}
                              >
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                  <div className={`text-sm ${product.current_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Stock: {product.current_stock} {product.unit}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">
                                    ₹{parseFloat(product.selling_price).toFixed(2)}
                                  </div>
                                  <button
                                    type="button"
                                    className="mt-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cart Items */}
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <ShoppingCartIcon className="h-5 w-5 mr-2" />
                          Cart Items ({cartItems.length})
                        </h3>
                      </div>
                      
                      {cartItems.length === 0 ? (
                        <div className="p-8 text-center">
                          <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No items in cart. Search and add products above.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cartItems.map((item, index) => (
                                <tr key={index} className="border-b border-gray-100">
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">
                                      ₹{parseFloat(item.unit_price).toFixed(2)}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => updateQuantity(index, item.quantity - 1)}
                                        className="h-6 w-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                                        className="w-16 text-center border border-gray-300 rounded py-1"
                                        min="1"
                                        max={item.current_stock}
                                      />
                                      <button
                                        onClick={() => updateQuantity(index, item.quantity + 1)}
                                        className="h-6 w-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-gray-900">
                                    ₹{parseFloat(item.total_price).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => removeFromCart(index)}
                                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Payment & Customer Info */}
                  <div className="lg:col-span-1">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name (Optional)</label>
                          <input
                            type="text"
                            value={customerInfo.name}
                            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Customer name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                          <input
                            type="email"
                            value={customerInfo.email}
                            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Customer email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                          <input
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Customer phone"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                          <select
                            value={paymentInfo.method}
                            onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Credit/Debit Card</option>
                            <option value="online">Online Payment</option>
                            <option value="credit">Credit</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
                          <input
                            type="number"
                            value={paymentInfo.discount}
                            onChange={(e) => setPaymentInfo({...paymentInfo, discount: e.target.value})}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                          <input
                            type="number"
                            value={paymentInfo.taxRate}
                            onChange={(e) => setPaymentInfo({...paymentInfo, taxRate: e.target.value})}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹) *</label>
                          <input
                            type="number"
                            value={paymentInfo.amountPaid}
                            onChange={(e) => setPaymentInfo({...paymentInfo, amountPaid: e.target.value})}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                          <textarea
                            value={paymentInfo.notes}
                            onChange={(e) => setPaymentInfo({...paymentInfo, notes: e.target.value})}
                            rows="2"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Discount:</span>
                          <span className="font-medium text-red-600">-₹{totals.discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax ({paymentInfo.taxRate}%):</span>
                          <span className="font-medium">₹{totals.tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2">
                          <div className="flex justify-between">
                            <span className="text-lg font-bold text-gray-900">Total:</span>
                            <span className="text-lg font-bold text-green-600">₹{totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-medium">₹{parseFloat(paymentInfo.amountPaid || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Change:</span>
                          <span className={`font-bold ${totals.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totals.change.toFixed(2)}
                          </span>
                        </div>
                        {totals.amountPaid < totals.total && (
                          <div className="flex justify-between border-t border-yellow-200 pt-2">
                            <span className="text-yellow-600 font-medium">Balance Due:</span>
                            <span className="text-yellow-600 font-bold">
                              ₹{(totals.total - totals.amountPaid).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowNewSaleModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleProcessSale}
                        disabled={cartItems.length === 0}
                        className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                          cartItems.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : totals.amountPaid >= totals.total
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-yellow-600 text-white hover:bg-yellow-700'
                        }`}
                      >
                        {totals.amountPaid >= totals.total ? 'Complete Sale' : 'Create Pending Sale'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sale Detail Modal */}
        {showSaleDetailModal && selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Sale Details</h2>
                  <button
                    onClick={() => {
                      setShowSaleDetailModal(false);
                      setSelectedSale(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Invoice Header */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedSale.invoice_number}</h3>
                      <p className="text-gray-600">
                        {new Date(selectedSale.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(selectedSale.status)}
                      {getPaymentBadge(selectedSale.payment_method)}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                    <p className="text-gray-600">
                      <strong>Name:</strong> {selectedSale.customer_name || 'Walk-in Customer'}
                    </p>
                    {selectedSale.customer_email && (
                      <p className="text-gray-600">
                        <strong>Email:</strong> {selectedSale.customer_email}
                      </p>
                    )}
                    {selectedSale.customer_phone && (
                      <p className="text-gray-600">
                        <strong>Phone:</strong> {selectedSale.customer_phone}
                      </p>
                    )}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Sale Information</h4>
                    <p className="text-gray-600">
                      <strong>Sold By:</strong> {selectedSale.sold_by_name || user?.name}
                    </p>
                    <p className="text-gray-600">
                      <strong>Payment Status:</strong> {selectedSale.payment_status}
                    </p>
                    {selectedSale.notes && (
                      <p className="text-gray-600 mt-2">
                        <strong>Notes:</strong> {selectedSale.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sale Items */}
                <div className="bg-white border border-gray-200 rounded-lg mb-6 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Sale Items ({selectedSale.items?.length || 0})</h4>
                  </div>
                  {selectedSale.items && selectedSale.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedSale.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{item.product_name}</div>
                                <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                              </td>
                              <td className="px-4 py-3">
                                ₹{parseFloat(item.unit_price).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">{item.quantity}</td>
                              <td className="px-4 py-3 font-bold text-gray-900">
                                ₹{parseFloat(item.total_price).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No items found for this sale.</p>
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Subtotal:</p>
                      <p className="text-gray-600">Discount:</p>
                      <p className="text-gray-600">Tax:</p>
                      <p className="text-lg font-bold text-gray-900 mt-2">Total:</p>
                      <p className="text-gray-600 mt-2">Amount Paid:</p>
                      <p className="text-gray-600">Change:</p>
                      {selectedSale.status === 'pending' && (
                        <p className="text-yellow-600 font-bold mt-2">Balance Due:</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">₹{parseFloat(selectedSale.total_amount || 0).toFixed(2)}</p>
                      <p className="text-red-600">-₹{parseFloat(selectedSale.discount_amount || 0).toFixed(2)}</p>
                      <p className="text-gray-600">₹{parseFloat(selectedSale.tax_amount || 0).toFixed(2)}</p>
                      <p className="text-lg font-bold text-green-600 mt-2">
                        ₹{parseFloat(selectedSale.final_amount || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-600 mt-2">₹{parseFloat(selectedSale.amount_paid || 0).toFixed(2)}</p>
                      <p className={`font-bold ${selectedSale.change_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{parseFloat(selectedSale.change_amount || 0).toFixed(2)}
                      </p>
                      {selectedSale.status === 'pending' && (
                        <p className="text-yellow-600 font-bold mt-2">
                          ₹{(selectedSale.final_amount - selectedSale.amount_paid).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => printReceipt(selectedSale)}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    <PrinterIcon className="h-5 w-5 inline mr-2" />
                    Print Receipt
                  </button>
                  {selectedSale.status === 'pending' && (
                    <button
                      onClick={() => {
                        setSaleToComplete(selectedSale);
                        setPaymentAmount((selectedSale.final_amount - selectedSale.amount_paid).toFixed(2));
                        setShowSaleDetailModal(false);
                        setShowCompletePendingModal(true);
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                    >
                      <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                      Complete Sale
                    </button>
                  )}
                  {selectedSale.status === 'completed' && (
                    <>
                      <button
                        onClick={() => {
                          handleCancelSale(selectedSale.id);
                          setShowSaleDetailModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors duration-200"
                      >
                        <XCircleIcon className="h-5 w-5 inline mr-2" />
                        Cancel Sale
                      </button>
                      <button
                        onClick={() => {
                          handleRefundSale(selectedSale.id);
                          setShowSaleDetailModal(false);
                        }}
                        className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200"
                      >
                        <ReceiptRefundIcon className="h-5 w-5 inline mr-2" />
                        Refund Sale
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Pending Sale Modal */}
        {showCompletePendingModal && saleToComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Complete Pending Sale</h2>
                  <button
                    onClick={() => {
                      setShowCompletePendingModal(false);
                      setSaleToComplete(null);
                      setPaymentAmount('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{saleToComplete.invoice_number}</h3>
                    <p className="text-gray-600">Customer: {saleToComplete.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-gray-600">Date: {new Date(saleToComplete.created_at).toLocaleString()}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold">₹{parseFloat(saleToComplete.final_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Already Paid:</span>
                        <span className="font-medium">₹{parseFloat(saleToComplete.amount_paid || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-4 border-t border-gray-200 pt-2">
                        <span className="text-yellow-600 font-bold">Balance Due:</span>
                        <span className="text-yellow-600 font-bold">
                          ₹{(saleToComplete.final_amount - saleToComplete.amount_paid).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Amount (₹) *
                      </label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        min={saleToComplete.final_amount - saleToComplete.amount_paid}
                        step="0.01"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Minimum: ₹{(saleToComplete.final_amount - saleToComplete.amount_paid).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method
                      </label>
                      <select
                        value={saleToComplete.payment_method}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="online">Online Payment</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>

                    {parseFloat(paymentAmount) > (saleToComplete.final_amount - saleToComplete.amount_paid) && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-green-700">Change:</span>
                          <span className="font-bold text-green-700">
                            ₹{(parseFloat(paymentAmount) - (saleToComplete.final_amount - saleToComplete.amount_paid)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCompletePendingModal(false);
                      setSaleToComplete(null);
                      setPaymentAmount('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCompletePendingSale}
                    disabled={!paymentAmount || parseFloat(paymentAmount) < (saleToComplete.final_amount - saleToComplete.amount_paid)}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                      !paymentAmount || parseFloat(paymentAmount) < (saleToComplete.final_amount - saleToComplete.amount_paid)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <BanknotesIcon className="h-5 w-5 inline mr-2" />
                    Complete Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalesPage;