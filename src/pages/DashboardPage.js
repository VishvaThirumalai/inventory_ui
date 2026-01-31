import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import {
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  ChartPieIcon,
  ArrowPathIcon,
  CalendarIcon,
  TagIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // REAL Data States
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    todaySales: 0,
    todayRevenue: 0,
    todaySalesChange: 0,
    todayRevenueChange: 0,
    monthlyRevenue: 0,
    monthlyRevenueChange: 0,
    activeSuppliers: 0,
    inventoryValue: 0,
    inventoryWorth: 0,
    inventoryProfitPotential: 0,
    averageOrderValue: 0,
    inventoryTurnover: 0,
    topSellingProduct: '',
    topProductQuantity: 0,
    bestCustomer: '',
    bestCustomerSpent: 0
  });
  
  const [salesTrend, setSalesTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [categoryRevenue, setCategoryRevenue] = useState([]);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [supplierPerformance, setSupplierPerformance] = useState([]);

  // Chart colors
  const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const promises = [
        axios.get('api/dashboard/stats', { headers }),
        axios.get('api/dashboard/sales/trend', { headers }),
        axios.get('api/dashboard/products/top-selling?limit=5', { headers }),
        axios.get('api/dashboard/sales/recent?limit=5', { headers }),
        axios.get('api/dashboard/revenue-by-category', { headers }),
        axios.get('api/dashboard/inventory-summary', { headers }),
        axios.get('api/dashboard/supplier-performance', { headers })
      ];

      const responses = await Promise.allSettled(promises);

      responses.forEach((response, index) => {
        if (response.status === 'fulfilled' && response.value.data?.success) {
          const data = response.value.data.data;
          switch(index) {
            case 0: // stats
              setStats(data);
              break;
            case 1: // sales trend
              setSalesTrend(data);
              break;
            case 2: // top products
              setTopProducts(data);
              break;
            case 3: // recent sales
              setRecentSales(data);
              break;
            case 4: // category revenue
              setCategoryRevenue(data);
              break;
            case 5: // inventory summary
              setInventorySummary(data);
              break;
            case 6: // supplier performance
              setSupplierPerformance(data);
              break;
            default:
              break;
          }
        } else {
          console.warn(`Failed to fetch data for endpoint ${index}:`, response.reason?.message);
        }
      });

      toast.success('Dashboard data loaded!');
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Some data failed to load, showing available data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)}Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)}L`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(2)}K`;
    }
    return `₹${num.toFixed(2)}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0%';
    if (value === 0) return '0%';
    const num = parseFloat(value);
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num.toFixed(1)}%`;
  };

  const getTrendIcon = (value) => {
    if (value > 0) return <ArrowUpIcon className="h-3 w-3" />;
    if (value < 0) return <ArrowDownIcon className="h-3 w-3" />;
    return <ArrowRightIcon className="h-3 w-3" />;
  };

  // Prepare stats cards for mobile responsiveness
  const statCards = [
    { 
      title: 'Products', 
      value: formatNumber(stats.totalProducts),
      subtitle: 'Total Items',
      icon: CubeIcon, 
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      trend: null,
      trendUp: true,
      mobileOnly: false
    },
    { 
      title: 'Today\'s Sales', 
      value: formatNumber(stats.todaySales),
      subtitle: formatCurrency(stats.todayRevenue),
      icon: ShoppingCartIcon, 
      color: 'bg-gradient-to-r from-green-500 to-emerald-600',
      trend: formatPercentage(stats.todaySalesChange),
      trendUp: stats.todaySalesChange >= 0,
      mobileOnly: false
    },
    { 
      title: 'Stock Alerts', 
      value: stats.lowStockItems + stats.outOfStockItems,
      subtitle: `${stats.lowStockItems} Low, ${stats.outOfStockItems} Out`,
      icon: ExclamationTriangleIcon, 
      color: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      trend: stats.lowStockItems > 0 ? 'Check' : 'Good',
      trendUp: stats.lowStockItems === 0,
      mobileOnly: true
    },
    { 
      title: 'Monthly Revenue', 
      value: formatCurrency(stats.monthlyRevenue),
      subtitle: formatPercentage(stats.monthlyRevenueChange),
      icon: CurrencyDollarIcon, 
      color: 'bg-gradient-to-r from-purple-500 to-pink-600',
      trend: formatPercentage(stats.monthlyRevenueChange),
      trendUp: stats.monthlyRevenueChange >= 0,
      mobileOnly: false
    },
    { 
      title: 'Stock Worth', 
      value: formatCurrency(stats.inventoryWorth),
      subtitle: formatCurrency(stats.inventoryValue) + ' Cost',
      icon: ChartPieIcon, 
      color: 'bg-gradient-to-r from-indigo-500 to-blue-600',
      trend: formatCurrency(stats.inventoryProfitPotential) + ' Profit',
      trendUp: stats.inventoryProfitPotential > 0,
      mobileOnly: true
    },
    { 
      title: 'Suppliers', 
      value: stats.activeSuppliers,
      subtitle: 'Active Partners',
      icon: BuildingStorefrontIcon, 
      color: 'bg-gradient-to-r from-red-500 to-rose-600',
      trend: `${supplierPerformance.length} Rated`,
      trendUp: true,
      mobileOnly: true
    },
    { 
      title: 'Total Revenue', 
      value: formatCurrency(stats.totalRevenue),
      subtitle: formatNumber(stats.totalSales) + ' Orders',
      icon: CurrencyDollarIcon, 
      color: 'bg-gradient-to-r from-teal-500 to-cyan-600',
      trend: 'All Time',
      trendUp: true,
      mobileOnly: false
    },
    { 
      title: 'Avg. Order', 
      value: formatCurrency(stats.averageOrderValue),
      subtitle: 'Per Transaction',
      icon: ShoppingCartIcon, 
      color: 'bg-gradient-to-r from-amber-500 to-orange-600',
      trend: stats.totalSales + ' Sales',
      trendUp: true,
      mobileOnly: true
    }
  ];

  // Prepare inventory data for pie chart
  const inventoryPieData = inventorySummary ? [
    { name: 'In Stock', value: inventorySummary.stock_status.in_stock || 0, color: '#10B981' },
    { name: 'Low Stock', value: inventorySummary.stock_status.low_stock || 0, color: '#F59E0B' },
    { name: 'Out of Stock', value: inventorySummary.stock_status.out_of_stock || 0, color: '#EF4444' },
    { name: 'Discontinued', value: inventorySummary.stock_status.discontinued || 0, color: '#6B7280' }
  ] : [];

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-center px-4">Loading real-time dashboard data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header - Mobile Optimized */}
      <div className="mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              Welcome, {user?.name?.split(' ')[0] || 'Admin'}! 📊
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">
              Real-time inventory insights
              <span className="ml-2 text-xs sm:text-sm text-blue-600 block sm:inline">
                {new Date().toLocaleDateString('en-IN', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowPathIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Mobile Responsive */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`
                bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 
                hover:shadow-md transition-shadow
                ${stat.mobileOnly ? 'hidden sm:block' : ''}
                ${index >= 6 ? 'hidden lg:block' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={`${stat.color} p-2 sm:p-2.5 rounded-lg sm:rounded-xl`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                {stat.trend && (
                  <span className={`text-[10px] xs:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex items-center gap-0.5 ${
                    stat.trendUp 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {stat.trend.includes('%') && getTrendIcon(parseFloat(stat.trend))}
                    <span className="hidden xs:inline">{stat.trend}</span>
                    <span className="xs:hidden">
                      {stat.trend.includes('%') ? stat.trend.replace('%', '') : stat.trend.length > 5 ? stat.trend.substring(0, 3) + '..' : stat.trend}
                    </span>
                  </span>
                )}
              </div>
              <div>
                <p className="text-[10px] xs:text-xs text-gray-600 font-medium truncate">{stat.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1 truncate">{stat.value}</p>
                <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 truncate">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section - Mobile Stacked */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        {/* Sales Trend Chart */}
        <div className="lg:w-1/2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Sales Trend</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Last 7 Days</p>
            </div>
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280" 
                    fontSize={10}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    stroke="#6B7280" 
                    fontSize={10}
                    tick={{ fill: '#6B7280' }}
                    tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                      return [value, 'Sales'];
                    }}
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                    name="Sales Count"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.1} 
                    strokeWidth={2}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
                <ChartBarIcon className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-center">No sales data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Status */}
        <div className="lg:w-1/2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Inventory Status</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Stock Distribution</p>
            </div>
            <CubeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <div className="h-48 sm:h-56 md:h-64 lg:h-72">
            {inventoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    innerRadius={30}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {inventoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatNumber(value), 'Items']}
                    contentStyle={{ fontSize: '12px', padding: '8px' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
                <ChartPieIcon className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-center">No inventory data available</p>
              </div>
            )}
          </div>
          {inventorySummary && (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="font-medium">Stock Value</p>
                <p className="font-bold text-gray-900">{formatCurrency(inventorySummary.financial?.total_inventory_value)}</p>
              </div>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                <p className="font-medium">Profit Potential</p>
                <p className="font-bold text-green-600">{formatCurrency(inventorySummary.financial?.potential_profit)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue by Category */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 mx-2 sm:mx-0">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Revenue by Category</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Sales distribution</p>
          </div>
          <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <div className="h-48 sm:h-56 md:h-64 lg:h-72">
          {categoryRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="category" 
                  stroke="#6B7280" 
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis 
                  stroke="#6B7280" 
                  fontSize={10}
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => formatCurrency(value).replace('₹', '')}
                />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ fontSize: '12px', padding: '8px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  radius={[2, 2, 0, 0]}
                  name="Revenue"
                >
                  {categoryRevenue.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
              <TagIcon className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-sm text-center">No category revenue data</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales & Top Products - Stacked on mobile */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 px-2 sm:px-0">
        {/* Recent Sales */}
        <div className="lg:w-2/3 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Recent Sales</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Latest transactions</p>
            </div>
            <ShoppingCartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            {recentSales.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden xs:table-cell">Customer</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Status</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                        <span className="truncate max-w-[80px] sm:max-w-none inline-block">
                          {sale.invoice_number}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden xs:table-cell">
                        <span className="truncate max-w-[100px] sm:max-w-none inline-block">
                          {sale.customer_name}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-bold text-gray-900">
                        {formatCurrency(sale.final_amount)}
                      </td>
                      <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                          sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">
                        {sale.formatted_date.split(',')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCartIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No recent sales data</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:w-1/3 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Top Products</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Best sellers</p>
            </div>
            <ChartBarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center mr-2 sm:mr-3 ${
                        product.current_stock === 0 ? 'bg-red-100' :
                        product.current_stock <= (product.min_stock || 10) ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                        <CubeIcon className={`h-4 w-4 sm:h-5 sm:w-5 ${
                          product.current_stock === 0 ? 'text-red-600' :
                          product.current_stock <= (product.min_stock || 10) ? 'text-yellow-600' :
                          'text-green-600'
                        }`} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        {product.total_sales} sold
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs sm:text-sm font-bold text-gray-900">
                      {formatCurrency(product.total_revenue)}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500">
                      Stock: {product.current_stock}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CubeIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No product data available</p>
              </div>
            )}
          </div>
          {stats.topSellingProduct && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm font-medium text-blue-800 flex items-center">
                <span className="mr-1">🏆</span>
                Top Product
              </p>
              <p className="text-xs sm:text-sm font-bold text-blue-900 truncate mt-1">
                {stats.topSellingProduct}
              </p>
              <p className="text-[10px] sm:text-xs text-blue-600 mt-0.5">
                Sold {formatNumber(stats.topProductQuantity)} units
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Performance */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8 mx-2 sm:mx-0">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">Supplier Performance</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">Top 5 active suppliers</p>
          </div>
          <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          {supplierPerformance.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Orders</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">On-Time</th>
                  <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Products</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {supplierPerformance.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[100px] sm:max-w-none">
                        {supplier.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {supplier.contact}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-xs sm:text-sm font-medium mr-1">{supplier.rating.toFixed(1)}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${i < Math.floor(supplier.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{supplier.total_orders}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <span className={`text-xs sm:text-sm font-medium ${
                        supplier.on_time_delivery >= 95 ? 'text-green-600' :
                        supplier.on_time_delivery >= 90 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {supplier.on_time_delivery.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 hidden md:table-cell">
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{supplier.products_supplied || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UsersIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No supplier data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Insights - Grid for mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 px-2 sm:px-0">
        <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1 sm:mb-2">Avg. Order Value</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700 truncate">
            {formatCurrency(stats.averageOrderValue)}
          </p>
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1 sm:mt-2">
            {formatNumber(stats.totalSales)} sales
          </p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-green-900 mb-1 sm:mb-2">Best Customer</h3>
          <p className="text-sm sm:text-base font-bold text-green-700 truncate">
            {stats.bestCustomer || 'N/A'}
          </p>
          <p className="text-[10px] sm:text-xs text-green-600 mt-1 sm:mt-2">
            Spent {formatCurrency(stats.bestCustomerSpent)}
          </p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-purple-900 mb-1 sm:mb-2">Inventory Turnover</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-700">
            {stats.inventoryTurnover}x
          </p>
          <p className="text-[10px] sm:text-xs text-purple-600 mt-1 sm:mt-2">
            Sales vs Inventory
          </p>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-semibold text-amber-900 mb-1 sm:mb-2">Stock Health</h3>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-700">
            {inventorySummary ? Math.round(inventorySummary.health?.percentage || 0) : 0}%
          </p>
          <p className="text-[10px] sm:text-xs text-amber-600 mt-1 sm:mt-2">
            {inventorySummary?.health?.rating || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs sm:text-sm text-gray-500 mt-4 px-2 sm:px-0">
        <p>Data updates in real-time • Last refreshed: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </Layout>
  );
};

export default DashboardPage;
