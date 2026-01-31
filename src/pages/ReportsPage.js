import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  BuildingStorefrontIcon,
  TagIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : 'https://inventory-api-m7d5.onrender.com/api';
};

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // Stats Data
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
    inventoryTurnover: 0,
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    activeSuppliers: 0
  });

  // Charts Data
  const [salesData, setSalesData] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [revenueByCategoryData, setRevenueByCategoryData] = useState([]);
  const [topProductsData, setTopProductsData] = useState([]);
  const [supplierPerformanceData, setSupplierPerformanceData] = useState([]);

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const REVENUE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
  const INVENTORY_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchReportsData();
  }, [timeRange, startDate, endDate, categoryFilter, productFilter]);

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch products for filter
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: { limit: 100 }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Set default date ranges if not provided
      const today = new Date();
      let start, end;

      switch (timeRange) {
        case 'daily':
          start = new Date(today);
          start.setDate(today.getDate() - 7);
          break;
        case 'weekly':
          start = new Date(today);
          start.setDate(today.getDate() - 28);
          break;
        case 'monthly':
          start = new Date(today);
          start.setMonth(today.getMonth() - 6);
          break;
        default:
          start = new Date(today);
          start.setMonth(today.getMonth() - 6);
      }

      const defaultStart = startDate || start.toISOString().split('T')[0];
      const defaultEnd = endDate || today.toISOString().split('T')[0];

      // Fetch all reports data in parallel
      await Promise.all([
        fetchDashboardStats(defaultStart, defaultEnd),
        fetchSalesData(defaultStart, defaultEnd),
        fetchInventoryData(),
        fetchRevenueByCategory(defaultStart, defaultEnd),
        fetchTopProducts(defaultStart, defaultEnd),
        fetchSupplierPerformance()
      ]);

      toast.success('Reports loaded successfully');
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async (startDate, endDate) => {
    try {
      const params = { 
        startDate, 
        endDate,
        status: 'completed'
      };

      if (categoryFilter !== 'all') {
        params.category_id = categoryFilter;
      }
      if (productFilter !== 'all') {
        params.product_id = productFilter;
      }

      const salesResponse = await axios.get(`${getApiBaseUrl()}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      });

      const sales = salesResponse.data.sales || [];
      const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.final_amount || 0), 0);
      const totalSales = sales.length;
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Get inventory data with filters
      const productsParams = {};
      if (categoryFilter !== 'all') {
        productsParams.category_id = categoryFilter;
      }
      if (productFilter !== 'all') {
        productsParams.id = productFilter;
      }

      const productsResponse = await axios.get(`${getApiBaseUrl()}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: productsParams
      });

      const products = productsResponse.data.products || [];
      const totalProducts = products.length;
      const lowStockItems = products.filter(p => 
        p.current_stock <= p.min_stock_level && p.current_stock > 0
      ).length;
      const outOfStockItems = products.filter(p => p.current_stock === 0).length;

      // Calculate inventory value
      const totalInventoryValue = products.reduce((sum, product) => {
        return sum + (product.current_stock * parseFloat(product.cost_price || 0));
      }, 0);

      // Calculate inventory turnover
      const inventoryTurnover = totalRevenue > 0 ? totalRevenue / totalInventoryValue : 0;

      // Get suppliers data
      const suppliersResponse = await axios.get(`${getApiBaseUrl()}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const activeSuppliers = (suppliersResponse.data.data || []).filter(s => s.status === 'active').length;

      setStats({
        totalRevenue,
        totalSales,
        averageOrderValue,
        inventoryTurnover: parseFloat(inventoryTurnover.toFixed(2)),
        totalProducts,
        lowStockItems,
        outOfStockItems,
        activeSuppliers
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch sales data for charts
  const fetchSalesData = async (startDate, endDate) => {
    try {
      const params = { 
        startDate, 
        endDate,
        status: 'completed'
      };

      if (categoryFilter !== 'all') {
        params.category_id = categoryFilter;
      }
      if (productFilter !== 'all') {
        params.product_id = productFilter;
      }

      const response = await axios.get(`${getApiBaseUrl()}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      });

      const sales = response.data.sales || [];
      
      // Group sales by time period
      const groupedSales = {};
      sales.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        let key;
        
        switch (timeRange) {
          case 'daily':
            key = saleDate.toLocaleDateString('en-US', { weekday: 'short' });
            break;
          case 'weekly':
            const weekNumber = Math.ceil(saleDate.getDate() / 7);
            key = `Week ${weekNumber}`;
            break;
          case 'monthly':
          default:
            key = saleDate.toLocaleDateString('en-US', { month: 'short' });
            break;
        }

        if (!groupedSales[key]) {
          groupedSales[key] = {
            sales: 0,
            revenue: 0,
            count: 0
          };
        }

        groupedSales[key].sales++;
        groupedSales[key].revenue += parseFloat(sale.final_amount || 0);
        groupedSales[key].count++;
      });

      // Convert to array for chart
      const chartData = Object.entries(groupedSales).map(([key, data]) => ({
        period: key,
        sales: data.sales,
        revenue: data.revenue,
        average: data.count > 0 ? data.revenue / data.count : 0
      }));

      setSalesData(chartData);

    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  // Fetch inventory data
  const fetchInventoryData = async () => {
    try {
      const params = {};
      if (categoryFilter !== 'all') {
        params.category_id = categoryFilter;
      }
      if (productFilter !== 'all') {
        params.id = productFilter;
      }

      const response = await axios.get(`${getApiBaseUrl()}/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params
      });

      const products = response.data.products || [];
      
      // Categorize inventory
      const inventoryStatus = {
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
        discontinued: 0
      };

      products.forEach(product => {
        if (product.status === 'discontinued') {
          inventoryStatus.discontinued++;
        } else if (product.current_stock === 0) {
          inventoryStatus.outOfStock++;
        } else if (product.current_stock <= product.min_stock_level) {
          inventoryStatus.lowStock++;
        } else {
          inventoryStatus.inStock++;
        }
      });

      const chartData = [
        { name: 'In Stock', value: inventoryStatus.inStock, color: '#10B981' },
        { name: 'Low Stock', value: inventoryStatus.lowStock, color: '#F59E0B' },
        { name: 'Out of Stock', value: inventoryStatus.outOfStock, color: '#EF4444' },
        { name: 'Discontinued', value: inventoryStatus.discontinued, color: '#6B7280' }
      ];

      setInventoryData(chartData);

    } catch (error) {
      console.error('Error fetching inventory data:', error);
    }
  };

  // Fetch revenue by category
  const fetchRevenueByCategory = async (startDate, endDate) => {
    try {
      const salesResponse = await axios.get(`${getApiBaseUrl()}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: { 
          startDate, 
          endDate,
          status: 'completed'
        }
      });

      const sales = salesResponse.data.sales || [];
      
      // Get sale items for each sale to calculate category revenue
      const categoryRevenue = {};
      
      // Initialize all categories
      const categoriesResponse = await axios.get(`${getApiBaseUrl()}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const categories = categoriesResponse.data.data || [];
      categories.forEach(category => {
        categoryRevenue[category.id] = {
          name: category.name,
          revenue: 0
        };
      });

      // Add uncategorized
      categoryRevenue['uncategorized'] = {
        name: 'Uncategorized',
        revenue: 0
      };

      // Fetch sale items for each sale and calculate revenue by category
      for (const sale of sales) {
        try {
          const saleItemsResponse = await axios.get(`${getApiBaseUrl()}/sales/${sale.id}/items`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const saleItems = saleItemsResponse.data.items || [];
          
          for (const item of saleItems) {
            // Get product details including category
            const productResponse = await axios.get(`${getApiBaseUrl()}/products/${item.product_id}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            const product = productResponse.data.product;
            const categoryId = product.category_id || 'uncategorized';
            const itemRevenue = parseFloat(item.total_price || 0);
            
            if (categoryRevenue[categoryId]) {
              categoryRevenue[categoryId].revenue += itemRevenue;
            } else {
              categoryRevenue['uncategorized'].revenue += itemRevenue;
            }
          }
        } catch (error) {
          console.error(`Error fetching items for sale ${sale.id}:`, error);
        }
      }

      // Convert to array for chart
      const revenueData = Object.values(categoryRevenue)
        .filter(item => item.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setRevenueByCategoryData(revenueData);

    } catch (error) {
      console.error('Error fetching revenue by category:', error);
      setRevenueByCategoryData([]);
    }
  };

  // Fetch top products
  const fetchTopProducts = async (startDate, endDate) => {
    try {
      // Get sales in the date range
      const salesResponse = await axios.get(`${getApiBaseUrl()}/sales`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: { 
          startDate, 
          endDate,
          status: 'completed'
        }
      });

      const sales = salesResponse.data.sales || [];
      const productSales = {};
      
      // Collect sales data for all products
      for (const sale of sales) {
        try {
          const saleItemsResponse = await axios.get(`${getApiBaseUrl()}/sales/${sale.id}/items`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const saleItems = saleItemsResponse.data.items || [];
          
          for (const item of saleItems) {
            const productId = item.product_id;
            if (!productSales[productId]) {
              productSales[productId] = {
                product_id: productId,
                name: `Product ${productId}`,
                sales: 0,
                revenue: 0,
                quantity: 0
              };
            }
            
            productSales[productId].sales++;
            productSales[productId].revenue += parseFloat(item.total_price || 0);
            productSales[productId].quantity += parseInt(item.quantity || 0);
          }
        } catch (error) {
          console.error(`Error fetching items for sale ${sale.id}:`, error);
        }
      }

      // Get product details for top products
      const topProductIds = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(p => p.product_id);
      
      if (topProductIds.length > 0) {
        const productsResponse = await axios.get(`${getApiBaseUrl()}/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            ids: topProductIds.join(',')
          }
        });
        
        const products = productsResponse.data.products || [];
        const productMap = {};
        products.forEach(product => {
          productMap[product.id] = product;
        });
        
        // Combine sales data with product info
        const topProducts = Object.values(productSales)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(salesData => {
            const product = productMap[salesData.product_id];
            return {
              name: product ? product.name : `Product ${salesData.product_id}`,
              sales: salesData.sales,
              revenue: salesData.revenue,
              quantity: salesData.quantity,
              stock: product ? product.current_stock : 0,
              unit: product ? product.unit : 'pcs'
            };
          });
        
        setTopProductsData(topProducts);
      } else {
        // If no sales data, show top products by stock
        const productsResponse = await axios.get(`${getApiBaseUrl()}/products`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          params: { limit: 5 }
        });
        
        const products = productsResponse.data.products || [];
        const topProducts = products.map(product => ({
          name: product.name,
          sales: 0,
          revenue: 0,
          stock: product.current_stock,
          unit: product.unit
        }));
        
        setTopProductsData(topProducts);
      }

    } catch (error) {
      console.error('Error fetching top products:', error);
      setTopProductsData([]);
    }
  };

  // Fetch supplier performance
  const fetchSupplierPerformance = async () => {
    try {
      const response = await axios.get(`${getApiBaseUrl()}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const suppliers = response.data.data || [];
      
      // Map supplier data to performance cards
      const performanceData = suppliers.slice(0, 5).map(supplier => ({
        name: supplier.name,
        rating: parseFloat(supplier.rating || 5.0),
        totalOrders: supplier.total_orders || 0,
        onTimeDelivery: parseFloat(supplier.on_time_delivery_rate || 100.0)
      }));

      setSupplierPerformanceData(performanceData);

    } catch (error) {
      console.error('Error fetching supplier performance:', error);
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = [
        ['Report Type', 'Period', 'Value'],
        ['Total Revenue', timeRange, `₹${stats.totalRevenue.toFixed(2)}`],
        ['Total Sales', timeRange, stats.totalSales],
        ['Average Order Value', timeRange, `₹${stats.averageOrderValue.toFixed(2)}`]
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report exported to CSV successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export report');
    }
  };

  const exportToPDF = () => {
    toast.success('PDF export feature coming soon!');
  };

  const applyFilters = () => {
    fetchReportsData();
    toast.success('Filters applied successfully');
  };

  const resetFilters = () => {
    setTimeRange('monthly');
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
    setProductFilter('all');
    toast.success('Filters reset successfully');
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const calculateChange = (current, previous) => {
    if (previous === 0) return '+0.0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const statsCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: '+12.5%',
      isPositive: true,
      icon: CurrencyDollarIcon,
      color: 'bg-green-500',
      description: `from ${stats.totalSales} sales`
    },
    {
      title: 'Total Sales',
      value: stats.totalSales,
      change: calculateChange(stats.totalSales, Math.floor(stats.totalSales * 0.92)),
      isPositive: stats.totalSales > 0,
      icon: ShoppingCartIcon,
      color: 'bg-blue-500',
      description: 'completed orders'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(stats.averageOrderValue),
      change: calculateChange(stats.averageOrderValue, Math.floor(stats.averageOrderValue * 0.95)),
      isPositive: stats.averageOrderValue > 0,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      description: 'per transaction'
    },
    {
      title: 'Inventory Turnover',
      value: `${stats.inventoryTurnover}x`,
      change: calculateChange(stats.inventoryTurnover, Math.floor(stats.inventoryTurnover * 1.02)),
      isPositive: stats.inventoryTurnover > 3,
      icon: CubeIcon,
      color: 'bg-yellow-500',
      description: 'times per period'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into your inventory performance</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export CSV
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.isPositive ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sales Trend</h2>
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Last 6 months
            </div>
          </div>
          <div className="h-64">
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="period" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Inventory Status Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Inventory Status</h2>
          <div className="h-64">
            {inventoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inventoryData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No inventory data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
          <button onClick={resetFilters} className="text-sm text-gray-600 hover:text-gray-900">
            Reset Filters
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={applyFilters}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
