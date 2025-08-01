import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Appointments.css';

export default function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('http://localhost:8081/admin/appointments');
            setAppointments(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setError('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.patch(`http://localhost:8081/admin/appointments/${id}`, {
                status: newStatus
            });
            fetchAppointments(); // Refresh the list
        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment status');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this appointment?')) {
            try {
                await axios.delete(`http://localhost:8081/admin/appointments/${id}`);
                fetchAppointments(); // Refresh the list
            } catch (error) {
                console.error('Error deleting appointment:', error);
                alert('Failed to delete appointment');
            }
        }
    };

    if (loading) return <div>Loading appointments...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="appointments-container">
            <h2>Appointments Management</h2>
            <div className="appointments-table">
                <table>
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Mpesa</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(appointment => (
                            <tr key={appointment.id}>
                                <td>{appointment.username}</td>
                                <td>{appointment.haircut}</td>
                                <td>{new Date(appointment.date).toLocaleDateString()}</td>
                                <td>{appointment.time}</td>
                                <td>{appointment.mpesa}</td>
                                <td>
                                    <select
                                        value={appointment.status}
                                        onChange={(e) => handleStatusUpdate(appointment.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleDelete(appointment.id)}
                                        className="delete-btn"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}