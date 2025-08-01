import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header";
import NavComponent from "./NavComponent";
import "./Home.css"

export default function Home() {
    const [showBooking, setShowBooking] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        date: "",
        time: "",
        mpesa: ""
    });
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [transactionId, setTransactionId] = useState(null);

    const navigate = useNavigate();

     useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get('http://localhost:8081/services', {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (Array.isArray(response.data)) {
                setServices(response.data);
            } else {
                console.error('Invalid data format:', response.data);
                setError('Received invalid data format from server');
            }
        } catch (error) {
            console.error('Error details:', error);
            
            if (error.code === 'ECONNREFUSED') {
                setError('Cannot connect to server. Please make sure the server is running.');
            } else if (error.response?.status === 500) {
                setError(`Server error: ${error.response.data?.error || 'Unknown error'}`);
            } else {
                setError('Failed to load services. Please try again.');
            }
        } finally {
            setLoading(false);
        }  
    };

        const handleBooking = (service) => {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            const userString = localStorage.getItem('user');

            if (!isLoggedIn || !userString) {
                console.log('Login state:', { isLoggedIn, userString }); // Debug log
                navigate('/');
                return;
            }

            try {
                const user = JSON.parse(userString);
                if (!user.username) {
                    console.error('No username found in:', user); // Debug log
                    navigate('/');
                    return;
                }

                setSelectedService(service);
                setShowBooking(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                navigate('/');
            }
        };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        setPaymentStatus(null);
        
        // Get user data from localStorage
        const userString = localStorage.getItem('user');
        let username = '';
        
        try {
            const user = JSON.parse(userString);
            username = user.username;
        } catch (error) {
            console.error('Error parsing user data:', error);
            setPaymentLoading(false);
            setPaymentStatus({
                success: false,
                message: 'User authentication error. Please log in again.'
            });
            return;
        }
        
        const payload = {
            phoneNumber: form.mpesa,
            amount: selectedService.price,
            username: username,
            bookingDetails: {
                service: selectedService.name,
                date: form.date,
                time: form.time,
                style: selectedService.name // Using service name as style if not specified
            }
        };

        try {
            const response = await fetch('http://localhost:8081/api/booking/create-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            let data;
            const contentType = response.headers.get("Content-Type");
            
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.warn("Non-JSON response:", text);
                data = { message: 'Unexpected response from server' };
            }

            if (response.ok) {
                setPaymentStatus({
                    success: true,
                    message: 'STK push sent! Please check your phone to complete payment.'
                });
                
                if (data.checkoutRequestID) {
                    setTransactionId(data.checkoutRequestID);
                    // Poll for payment status after a delay
                    setTimeout(() => checkPaymentStatus(data.checkoutRequestID), 10000);
                }
            } else {
                setPaymentStatus({
                    success: false,
                    message: data.message || 'Booking failed. Please try again.'
                });
            }
        } catch (error) {
            console.error('Booking error:', error);
            setPaymentStatus({
                success: false,
                message: 'Connection error. Please check your internet and try again.'
            });
        } finally {
            setPaymentLoading(false);
        }
    };
    
    const checkPaymentStatus = async (checkoutRequestId) => {
        if (!checkoutRequestId) return;
        
        try {
            const response = await fetch(`http://localhost:8081/api/booking/transaction/${checkoutRequestId}`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.transaction) {
                    const transaction = data.transaction;
                    
                    if (transaction.status === 'paid') {
                        setPaymentStatus({
                            success: true,
                            message: 'Payment completed successfully! Your booking is confirmed.',
                            receipt: transaction.receipt_number
                        });
                        // Close booking form after successful payment
                        setTimeout(() => setShowBooking(false), 3000);
                    } else if (transaction.status === 'failed') {
                        setPaymentStatus({
                            success: false,
                            message: 'Payment failed. Please try again.'
                        });
                    } else {
                        // Payment still pending, check again after a delay
                        setTimeout(() => checkPaymentStatus(checkoutRequestId), 5000);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };


    return (
        <>
            <Header />
            <NavComponent />
            <div className="landing-container" style={{ padding: '2rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Our Services</h1>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        Loading services...
                    </div>
                ) : error ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem', 
                        color: 'red' 
                    }}>
                        {error}
                    </div>
                ) : services.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        No services available at the moment.
                    </div>
                ) : (
                    <div className="services-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        padding: '1rem'
                    }}>
                        {services.map(service => (
                            <div key={service.id} className="service-card" style={{
                                background: 'white',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transition: 'transform 0.2s'
                            }}>
                                <img 
                                    src={`http://localhost:8081/uploads/${service.image}`}
                                    alt={service.name}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/default-service.jpg';
                                    }}
                                    style={{
                                        width: '100%',
                                        height: '200px',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{ padding: '1rem' }}>
                                    <h3>{service.name}</h3>
                                    <p style={{ color: '#007bff', fontWeight: 'bold' }}>
                                        KES {service.price}
                                    </p>
                                    <p>{service.description}</p>
                                    <button 
                                        onClick={() => handleBooking(service)}
                                        style={{
                                            width: '100%',
                                            padding: '0.8rem',
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showBooking && (
                    <div className="booking-popup">
                        <div className="popup-content">
                            <button onClick={() => setShowBooking(false)} className="close-btn">×</button>
                            <h2>Book {selectedService?.name}</h2>
                            <form onSubmit={handleBookingSubmit}>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({...form, date: e.target.value})}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                    disabled={paymentLoading}
                                />
                                
                                <input
                                    type="time"
                                    value={form.time}
                                    onChange={e => setForm({...form, time: e.target.value})}
                                    min="09:00"
                                    max="17:00"
                                    required
                                    disabled={paymentLoading}
                                />

                                <input
                                    type="text"
                                    placeholder="Mpesa Number (e.g., 0712345678)"
                                    value={form.mpesa}
                                    onChange={e => setForm({...form, mpesa: e.target.value})}
                                    pattern="^07\d{8}$"
                                    title="Please enter a valid Mpesa number starting with 07"
                                    required
                                    disabled={paymentLoading}
                                />

                                <p className="service-details">
                                    <strong>Service:</strong> {selectedService?.name}<br/>
                                    <strong>Price:</strong> KES {selectedService?.price}
                                </p>

                                {paymentStatus && (
                                    <div className={`payment-status ${paymentStatus.success ? 'success' : 'error'}`}>
                                        <p>{paymentStatus.message}</p>
                                        {paymentStatus.receipt && (
                                            <p className="receipt-number">
                                                Receipt: {paymentStatus.receipt}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={paymentLoading}
                                >
                                    {paymentLoading ? 'Processing Payment...' : 'Confirm Booking'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}