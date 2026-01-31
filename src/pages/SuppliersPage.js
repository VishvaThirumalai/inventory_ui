import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BuildingStorefrontIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  StarIcon
} from '@heroicons/react/24/outline';

// Helper function to get API base URL
const getApiBaseUrl = () => {
  return process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api' 
    : 'https://inventory-api-m7d5.onrender.com/api';
};

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
    status: 'active',
    rating: 5.0,
    total_orders: 0,
    on_time_delivery_rate: 100.0
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiBaseUrl()}/suppliers`);
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Helper function to safely parse numbers
  const parseNumber = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Populate form when editing
  useEffect(() => {
    if (editingSupplier) {
      setFormData({
        name: editingSupplier.name || '',
        email: editingSupplier.email || '',
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || '',
        contact_person: editingSupplier.contact_person || '',
        status: editingSupplier.status || 'active',
        rating: parseNumber(editingSupplier.rating, 5.0),
        total_orders: parseNumber(editingSupplier.total_orders, 0),
        on_time_delivery_rate: parseNumber(editingSupplier.on_time_delivery_rate, 100.0)
      });
      setShowModal(true);
    }
  }, [editingSupplier]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    
    try {
      await axios.delete(`${getApiBaseUrl()}/suppliers/${id}`);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete supplier');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' || name === 'on_time_delivery_rate' || name === 'total_orders' 
        ? parseNumber(value, name === 'total_orders' ? 0 : name === 'rating' ? 5.0 : 100.0)
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingSupplier 
        ? `${getApiBaseUrl()}/suppliers/${editingSupplier.id}`
        : `${getApiBaseUrl()}/suppliers`;
      
      const method = editingSupplier ? 'put' : 'post';
      
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Remove server-generated fields for new suppliers
      if (!editingSupplier) {
        delete submitData.rating;
        delete submitData.total_orders;
        delete submitData.on_time_delivery_rate;
      }
      
      await axios[method](url, submitData);
      
      toast.success(editingSupplier 
        ? 'Supplier updated successfully' 
        : 'Supplier created successfully');
      
      setShowModal(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        contact_person: '',
        status: 'active',
        rating: 5.0,
        total_orders: 0,
        on_time_delivery_rate: 100.0
      });
      
      fetchSuppliers();
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      } else {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    }
  };

  const handleResetForm = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      contact_person: '',
      status: 'active',
      rating: 5.0,
      total_orders: 0,
      on_time_delivery_rate: 100.0
    });
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Render star rating
  const renderRating = (rating) => {
    // Convert rating to number
    const ratingNum = parseNumber(rating, 5.0);
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <StarIcon
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(ratingNum) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{ratingNum.toFixed(1)}</span>
      </div>
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Contact Person', 'Email', 'Phone', 'Address', 'Status', 'Rating', 'Total Orders', 'On Time Delivery'];
    const csvContent = [
      headers.join(','),
      ...filteredSuppliers.map(s => [
        `"${s.name}"`,
        `"${s.contact_person || ''}"`,
        `"${s.email || ''}"`,
        `"${s.phone || ''}"`,
        `"${s.address || ''}"`,
        s.status,
        parseNumber(s.rating, 5.0).toFixed(1),
        parseNumber(s.total_orders, 0),
        parseNumber(s.on_time_delivery_rate, 100.0).toFixed(1)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'suppliers.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Suppliers exported to CSV');
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suppliers</h1>
              <p className="text-gray-600 mt-1">Manage your product suppliers</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                Export CSV
              </button>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-200"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Supplier
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search suppliers by name, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <div className="text-sm text-gray-600">
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-6">{searchTerm ? 'Try a different search term' : 'Add your first supplier to get started.'}</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
  <div className="flex items-start justify-between mb-4">
    <div className="flex items-center">
      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
        <BuildingStorefrontIcon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-900">{supplier.name}</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            ID: {supplier.id}
          </span>
        </div>
        <div className="flex items-center mt-1">
          {supplier.status === 'active' ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs font-medium ${
            supplier.status === 'active' ? 'text-green-600' : 'text-red-600'
          }`}>
            {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
          </span>
        </div>
      </div>
    </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingSupplier(supplier)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit supplier"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(supplier.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete supplier"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {supplier.contact_person && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Contact:</span> {supplier.contact_person}
                    </div>
                  )}
                  
                  {supplier.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-blue-600">
                        {supplier.email}
                      </a>
                    </div>
                  )}
                  
                  {supplier.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${supplier.phone}`} className="hover:text-blue-600">
                        {supplier.phone}
                      </a>
                    </div>
                  )}
                  
                  {supplier.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                      <span className="flex-1">{supplier.address}</span>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Rating:</span>
                      {renderRating(supplier.rating)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Orders:</span>
                      <span className="font-medium text-gray-900">
                        {parseNumber(supplier.total_orders, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">On Time Delivery:</span>
                      <span className="font-medium text-gray-900">
                        {parseNumber(supplier.on_time_delivery_rate, 100.0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Supplier Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter supplier name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="supplier@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Enter full address"
                      />
                    </div>
                    
                    {/* Performance Fields (only for editing) */}
                    {editingSupplier && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating (1-5)
                          </label>
                          <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Orders
                          </label>
                          <input
                            type="number"
                            name="total_orders"
                            value={formData.total_orders}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            On Time Delivery Rate (%)
                          </label>
                          <input
                            type="number"
                            name="on_time_delivery_rate"
                            value={formData.on_time_delivery_rate}
                            onChange={handleChange}
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {editingSupplier ? 'Update' : 'Save'}
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

export default SuppliersPage;
