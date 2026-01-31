import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  TagIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : 'https://inventory-api-m7d5.onrender.com/api';
};

const ProductsPage = () => {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [filteredProducts, setFilteredProducts] = useState([]); // Store filtered products
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    supplier_id: '',
    cost_price: '',
    selling_price: '',
    current_stock: '',
    min_stock_level: '10',
    max_stock_level: '100',
    unit: 'pcs',
    custom_unit: '',
    status: 'active'
  });
  const [stockQuantity, setStockQuantity] = useState('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  // Fetch categories function
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch suppliers function
  const fetchSuppliers = async () => {
    try {
      setSuppliersLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/suppliers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers');
    } finally {
      setSuppliersLoading(false);
    }
  };

 const fetchProducts = async () => {
  try {
    setLoading(true);
    
    console.log('Fetching products with filters...');
    
    // Build query parameters including filters
    const params = new URLSearchParams();
    
    // Only include filter if it's not the default
    if (filter && filter !== 'all') {
      params.append('status', filter);
    }
    
    if (categoryFilter) {
      params.append('category_id', categoryFilter);
    }
    
    if (supplierFilter) {
      params.append('supplier_id', supplierFilter);
    }
    
    if (search) {
      params.append('search', search);
    }
    
    // Include pagination parameters
    params.append('page', currentPage);
    params.append('limit', itemsPerPage);
    
    // Fetch products WITH filters from backend
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/products?${params.toString()}`;
    console.log('Fetching from:', url);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('Received products:', response.data.products?.length || 0);
    
    // Update state with the paginated response
    if (response.data.success) {
      setFilteredProducts(response.data.products || []);
      setTotalItems(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
      // Store all products separately if needed (for local filtering)
      setAllProducts(response.data.products || []);
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
    toast.error(error.response?.data?.message || 'Failed to fetch products');
    // Fallback to empty arrays
    setFilteredProducts([]);
    setAllProducts([]);
  } finally {
    setLoading(false);
  }
};
  // Apply filters locally
  const applyFilters = (products) => {
    console.log('Applying filters:', {
      search,
      filter,
      categoryFilter,
      supplierFilter
    });
    
    let filtered = [...products];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply status filter
    if (filter && filter !== 'all') {
      console.log('Applying status filter:', filter);
      filtered = filtered.filter(product => {
        switch(filter) {
          case 'active':
            return product.status === 'active';
          case 'out_of_stock':
            return product.current_stock === 0 && product.status !== 'discontinued';
          case 'low_stock':
            return product.current_stock > 0 && 
                   product.current_stock <= product.min_stock_level && 
                   product.status !== 'discontinued';
          case 'in_stock':
            return product.current_stock > product.min_stock_level && 
                   product.status !== 'discontinued';
          case 'discontinued':
            return product.status === 'discontinued';
          default:
            return true;
        }
      });
    }
    
    // Apply category filter
    if (categoryFilter) {
      console.log('Applying category filter:', categoryFilter);
      filtered = filtered.filter(product => 
        product.category_id && product.category_id.toString() === categoryFilter
      );
    }
    
    // Apply supplier filter
    if (supplierFilter) {
      console.log('Applying supplier filter:', supplierFilter);
      filtered = filtered.filter(product => 
        product.supplier_id && product.supplier_id.toString() === supplierFilter
      );
    }
    
    console.log('Filtered products count:', filtered.length);
    setFilteredProducts(filtered);
    
    // Update pagination based on filtered results
    const total = filtered.length;
    setTotalItems(total);
    setTotalPages(Math.ceil(total / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change
  };

  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // Apply filters whenever they change
useEffect(() => {
  fetchProducts();
}, [currentPage, itemsPerPage]); // Fetch when pagination changes

useEffect(() => {
  // Reset to page 1 when filters change and fetch new data
  setCurrentPage(1);
  fetchProducts();
}, [search, filter, categoryFilter, supplierFilter]);

  // Get products for current page
  

  // Handle responsive items per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) { // Mobile
        setItemsPerPage(5);
      } else if (window.innerWidth < 1024) { // Tablet
        setItemsPerPage(8);
      } else { // Desktop
        setItemsPerPage(10);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle unit selection change
  const handleUnitChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomUnit(true);
      setFormData(prev => ({
        ...prev,
        unit: '',
        custom_unit: ''
      }));
    } else {
      setShowCustomUnit(false);
      setFormData(prev => ({
        ...prev,
        unit: value,
        custom_unit: ''
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const baseUrl = getApiBaseUrl();
      await axios.delete(`${baseUrl}/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('Product deleted successfully');
      fetchProducts(); // Refresh all products
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    
    // Check if unit is in the standard options
    const standardUnits = ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'dozen', 'meter', 'cm', 'set', 'pair'];
    const isCustomUnit = product.unit && !standardUnits.includes(product.unit);
    
    setShowCustomUnit(isCustomUnit);
    
    // Convert category_id and supplier_id to strings for select inputs
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      category_id: product.category_id ? product.category_id.toString() : '',
      supplier_id: product.supplier_id ? product.supplier_id.toString() : '',
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      min_stock_level: product.min_stock_level,
      max_stock_level: product.max_stock_level,
      unit: isCustomUnit ? 'custom' : (product.unit || 'pcs'),
      custom_unit: isCustomUnit ? product.unit : '',
      status: product.status
    });
    setShowModal(true);
  };

  const handleStockUpdate = (product) => {
    setSelectedProductForStock(product);
    setStockQuantity('');
    setShowStockModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const baseUrl = getApiBaseUrl();
      const url = editingProduct 
        ? `${baseUrl}/products/${editingProduct.id}`
        : `${baseUrl}/products`;
      
      const method = editingProduct ? 'put' : 'post';
      
      // Use custom unit if provided, otherwise use selected unit
      const finalUnit = showCustomUnit && formData.custom_unit 
        ? formData.custom_unit 
        : formData.unit;
      
      // Prepare data - convert numeric fields
      const submitData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || '',
        cost_price: parseFloat(formData.cost_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        current_stock: parseInt(formData.current_stock) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 10,
        max_stock_level: parseInt(formData.max_stock_level) || 100,
        unit: finalUnit,
        status: formData.status,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null
      };
      
      console.log('Submitting product data:', submitData);
      
      const response = await axios[method](url, submitData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success(`Product ${editingProduct ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        supplier_id: '',
        cost_price: '',
        selling_price: '',
        current_stock: '',
        min_stock_level: '10',
        max_stock_level: '100',
        unit: 'pcs',
        custom_unit: '',
        status: 'active'
      });
      setShowCustomUnit(false);
      fetchProducts(); // Refresh all products
    } catch (error) {
      console.error('Submit error:', error.response?.data || error);
      toast.error(error.response?.data?.message || `Failed to ${editingProduct ? 'update' : 'create'} product`);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!stockQuantity || isNaN(stockQuantity)) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      const baseUrl = getApiBaseUrl();
      await axios.put(`${baseUrl}/products/${selectedProductForStock.id}/stock`, 
        { quantity: parseInt(stockQuantity) },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      toast.success('Stock updated successfully');
      setShowStockModal(false);
      setSelectedProductForStock(null);
      setStockQuantity('');
      fetchProducts(); // Refresh all products
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const getStockStatus = (current, min) => {
    if (current === 0) return 'out_of_stock';
    if (current <= min) return 'low_stock';
    return 'in_stock';
  };

  const getStockColor = (current, min) => {
    if (current === 0) return 'bg-red-500';
    if (current <= min) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(cat => cat.id === parseInt(categoryId));
    return category ? category.name : 'Unknown Category';
  };

  // Helper function to get supplier name by ID
  const getSupplierName = (supplierId) => {
    if (!supplierId) return 'No Supplier';
    const supplier = suppliers.find(sup => sup.id === parseInt(supplierId));
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setCategoryFilter('');
    setSupplierFilter('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const isFilterActive = () => {
    return search || filter !== 'all' || categoryFilter || supplierFilter;
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="hidden sm:block">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{' '}
            of <span className="font-medium">{totalItems}</span> products
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2 text-gray-500">...</span>}
            </>
          )}
          
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-gray-500">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-2 sm:mt-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setCurrentPage(1);
            }}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>
    );
  };

  // Get products for current page
const currentProducts = filteredProducts;
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-gray-600 mt-1">Manage your inventory products</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {isFilterActive() && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    name: '',
                    sku: '',
                    description: '',
                    category_id: '',
                    supplier_id: '',
                    cost_price: '',
                    selling_price: '',
                    current_stock: '',
                    min_stock_level: '10',
                    max_stock_level: '100',
                    unit: 'pcs',
                    custom_unit: '',
                    status: 'active'
                  });
                  setShowCustomUnit(false);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products by name, SKU, or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <TagIcon className="h-5 w-5 text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id.toString()}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Supplier Filter */}
            <div className="flex items-center space-x-2">
              <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 w-full sm:w-auto text-sm sm:text-base"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="in_stock">In Stock</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
          
          {/* Active filters indicator */}
          {isFilterActive() && (
            <div className="mt-4 flex flex-wrap gap-2">
              {search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Search: "{search}"
                  <button
                    onClick={() => setSearch('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Status: {filter}
                  <button
                    onClick={() => setFilter('all')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Category: {categories.find(c => c.id.toString() === categoryFilter)?.name || categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {supplierFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Supplier: {suppliers.find(s => s.id.toString() === supplierFilter)?.name || supplierFilter}
                  <button
                    onClick={() => setSupplierFilter('')}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : currentProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CubeIcon className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isFilterActive() ? 'No products match your filters' : 'No products found'}
              </h3>
              <p className="text-gray-600 mb-6">
                {isFilterActive() 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first product.'}
              </p>
              {isFilterActive() ? (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add First Product
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                        Stock
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                        Price
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[160px]">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <CubeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-xs">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-xs">
                                {product.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="text-xs sm:text-sm font-mono bg-gray-50 px-2 sm:px-3 py-1 rounded-md truncate max-w-[100px] sm:max-w-full">
                            {product.sku}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                          <div className="flex items-center">
                            <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900 truncate max-w-[120px]">
                              {getCategoryName(product.category_id)}
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 sm:px-6 py-4">
                          <div className="flex items-center">
                            <BuildingStorefrontIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <div className="text-sm text-gray-900 truncate max-w-[120px]">
                              {getSupplierName(product.supplier_id)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 min-w-[100px]">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full flex-shrink-0 ${getStockColor(product.current_stock, product.min_stock_level)}`}></div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                {product.current_stock} {product.unit}
                              </div>
                              <div className="text-xs text-gray-500 hidden sm:block whitespace-nowrap">
                                Min: {product.min_stock_level} | Max: {product.max_stock_level}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 sm:px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            ₹{parseFloat(product.selling_price).toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Cost: ₹{parseFloat(product.cost_price).toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Margin: ₹{(parseFloat(product.selling_price) - parseFloat(product.cost_price)).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                            getStockStatus(product.current_stock, product.min_stock_level) === 'out_of_stock' 
                              ? 'bg-red-100 text-red-800' 
                              : getStockStatus(product.current_stock, product.min_stock_level) === 'low_stock'
                              ? 'bg-yellow-100 text-yellow-800'
                              : product.status === 'discontinued'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {getStockStatus(product.current_stock, product.min_stock_level) === 'out_of_stock' 
                              ? 'Out of Stock'
                              : getStockStatus(product.current_stock, product.min_stock_level) === 'low_stock'
                              ? 'Low Stock'
                              : product.status === 'discontinued'
                              ? 'Discontinued'
                              : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900 p-1 sm:p-2 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStockUpdate(product)}
                              className="text-green-600 hover:text-green-900 p-1 sm:p-2 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Update Stock"
                            >
                              <ArrowUpTrayIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 p-1 sm:p-2 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div> 
              {/* Pagination */}
              <Pagination />
            </>
          )}
        </div>

        {/* Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingProduct(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU *
                      </label>
                      <input
                        type="text"
                        name="sku"
                        required
                        value={formData.sku}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter SKU"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product description"
                      />
                    </div>
                    
                    {/* CATEGORY SELECT DROPDOWN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <div className="flex space-x-2">
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Category (Optional)</option>
                          {categoriesLoading ? (
                            <option value="" disabled>Loading categories...</option>
                          ) : (
                            categories.map(category => (
                              <option key={category.id} value={category.id.toString()}>
                                {category.name}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={fetchCategories}
                          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          title="Refresh categories"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* SUPPLIER SELECT DROPDOWN */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier
                      </label>
                      <div className="flex space-x-2">
                        <select
                          name="supplier_id"
                          value={formData.supplier_id}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Supplier (Optional)</option>
                          {suppliersLoading ? (
                            <option value="" disabled>Loading suppliers...</option>
                          ) : (
                            suppliers.map(supplier => (
                              <option key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={fetchSuppliers}
                          className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                          title="Refresh suppliers"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cost Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          name="cost_price"
                          required
                          min="0"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selling Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          name="selling_price"
                          required
                          min="0"
                          step="0.01"
                          value={formData.selling_price}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Stock
                      </label>
                      <input
                        type="number"
                        name="current_stock"
                        min="0"
                        value={formData.current_stock}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    
                    {/* UNIT SELECT WITH CUSTOM OPTION */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleUnitChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="g">Grams (g)</option>
                        <option value="l">Liters (l)</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="box">Box</option>
                        <option value="pack">Pack</option>
                        <option value="dozen">Dozen</option>
                        <option value="meter">Meter (m)</option>
                        <option value="cm">Centimeter (cm)</option>
                        <option value="set">Set</option>
                        <option value="pair">Pair</option>
                        <option value="custom">Custom Unit...</option>
                      </select>
                      
                      {/* Custom Unit Input (shown when "Custom Unit..." is selected) */}
                      {showCustomUnit && (
                        <div className="mt-2">
                          <input
                            type="text"
                            name="custom_unit"
                            value={formData.custom_unit}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter custom unit (e.g., bottle, carton, etc.)"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Examples: bottle, carton, packet, roll, sheet, etc.
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Stock Level
                      </label>
                      <input
                        type="number"
                        name="min_stock_level"
                        min="0"
                        value={formData.min_stock_level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Stock Level
                      </label>
                      <input
                        type="number"
                        name="max_stock_level"
                        min="1"
                        value={formData.max_stock_level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">Active</option>
                        <option value="out_of_stock">Out of Stock</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingProduct(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                    >
                      {editingProduct ? 'Update Product' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Stock Update Modal */}
        {showStockModal && selectedProductForStock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Update Stock
                  </h2>
                  <button
                    onClick={() => {
                      setShowStockModal(false);
                      setSelectedProductForStock(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CubeIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedProductForStock.name}</h3>
                      <div className="text-sm text-gray-600">
                        Current Stock: <span className="font-medium">{selectedProductForStock.current_stock} {selectedProductForStock.unit}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        SKU: <span className="font-mono">{selectedProductForStock.sku}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleStockSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity to Add/Remove
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter positive number to add, negative to remove"
                      />
                      <div className="text-sm text-gray-500 mt-2">
                        Tip: Use positive numbers to add stock, negative to remove stock
                      </div>
                    </div>
                  </div>
                  
                  {stockQuantity && !isNaN(stockQuantity) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">New stock will be:</div>
                      <div className="text-lg font-bold text-gray-900">
                        {parseInt(selectedProductForStock.current_stock) + parseInt(stockQuantity)} {selectedProductForStock.unit}
                      </div>
                      <div className={`text-sm ${parseInt(stockQuantity) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseInt(stockQuantity) >= 0 ? '+' : ''}{stockQuantity} {selectedProductForStock.unit}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockModal(false);
                        setSelectedProductForStock(null);
                      }}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 shadow-sm"
                    >
                      Update Stock
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;