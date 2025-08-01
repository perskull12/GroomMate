import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ServiceManagement.css';

export default function ServiceManagement() {
    const [services, setServices] = useState([]);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        image: null
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all services
    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8081/services');
            setServices(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching services:', error);
            setError('Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            setFormData({ ...formData, image: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Handle service creation/update
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('price', formData.price);
            formDataToSend.append('description', formData.description);
            if (formData.image) {
                formDataToSend.append('image', formData.image);
            }

            if (editingService) {
                await axios.put(
                    `http://localhost:8081/admin/services/${editingService.id}`,
                    formDataToSend,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );
            } else {
                await axios.post(
                    'http://localhost:8081/admin/services',
                    formDataToSend,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    }
                );
            }

            setFormData({
                name: '',
                price: '',
                description: '',
                image: null
            });
            setEditingService(null);
            fetchServices();
        } catch (error) {
            console.error('Error saving service:', error);
            alert(error.response?.data?.error || 'Error saving service');
        }
    };

    // Handle service deletion
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            try {
                await axios.delete(`http://localhost:8081/admin/services/${id}`);
                fetchServices();
            } catch (error) {
                console.error('Error deleting service:', error);
                alert('Failed to delete service');
            }
        }
    };

    // Set up service for editing
    const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            price: service.price,
            description: service.description,
            image: null // Reset image when editing
        });
    };

    return (
        <div className="service-management">
            <h2>Service Management</h2>
            
            <form onSubmit={handleSubmit} className="service-form">
                <h3>{editingService ? 'Edit Service' : 'Create New Service'}</h3>
                <input
                    type="text"
                    name="name"
                    placeholder="Service Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                    required={!editingService}
                />
                <button type="submit">
                    {editingService ? 'Update Service' : 'Create Service'}
                </button>
                {editingService && (
                    <button 
                        type="button" 
                        onClick={() => {
                            setEditingService(null);
                            setFormData({
                                name: '',
                                price: '',
                                description: '',
                                image: null
                            });
                        }}
                    >
                        Cancel Edit
                    </button>
                )}
            </form>

            {loading ? (
                <div className="loading">Loading services...</div>
            ) : error ? (
                <div className="error">{error}</div>
            ) : (
                <div className="services-grid">
                    {services.map(service => (
                        <div key={service.id} className="service-card">
                            <img
                                src={`http://localhost:8081/uploads/${service.image}`}
                                alt={service.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default-service.jpg';
                                }}
                            />
                            <div className="service-details">
                                <h3>{service.name}</h3>
                                <p className="price">KES {service.price}</p>
                                <p>{service.description}</p>
                                <div className="action-buttons">
                                    <button onClick={() => handleEdit(service)}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(service.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}