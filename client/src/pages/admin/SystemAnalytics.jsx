import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function SystemAnalytics() {
    const [analytics, setAnalytics] = useState({
        totalUsers: 0,
        totalAppointments: 0,
        revenue: 0,
        appointmentsByStatus: [],
        revenueByMonth: [],
        popularServices: []
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const response = await axios.get('http://localhost:8081/admin/analytics');
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    return (
        <div className="analytics-container" style={{ padding: '20px' }}>
            <h2>System Analytics</h2>

            {/* Key Metrics Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <MetricCard
                    title="Total Users"
                    value={analytics.totalUsers}
                    icon="👥"
                />
                <MetricCard
                    title="Total Appointments"
                    value={analytics.totalAppointments}
                    icon="📅"
                />
                <MetricCard
                    title="Revenue (KES)"
                    value={`${analytics.revenue.toLocaleString()}`}
                    icon="💰"
                />
            </div>

            {/* Charts Section */}
            <div className="charts-grid" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                gap: '20px'
            }}>
                {/* Monthly Revenue Chart */}
                <div className="chart-container">
                    <h3>Monthly Revenue</h3>
                    <BarChart width={500} height={300} data={analytics.revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                </div>

                {/* Appointment Status Distribution */}
                <div className="chart-container">
                    <h3>Appointment Status Distribution</h3>
                    <PieChart width={400} height={300}>
                        <Pie
                            data={analytics.appointmentsByStatus}
                            cx={200}
                            cy={150}
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {analytics.appointmentsByStatus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </div>

                {/* Popular Services Chart */}
                <div className="chart-container">
                    <h3>Popular Services</h3>
                    <BarChart width={500} height={300} data={analytics.popularServices}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#82ca9d" />
                    </BarChart>
                </div>
            </div>

            {/* Additional Metrics */}
            <div className="additional-metrics" style={{ marginTop: '30px' }}>
                <h3>Key Performance Indicators</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Value</th>
                            <th>Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Average Daily Appointments</td>
                            <td>{(analytics.totalAppointments / 30).toFixed(1)}</td>
                            <td style={{ color: 'green' }}>↑ 5%</td>
                        </tr>
                        <tr>
                            <td>Customer Retention Rate</td>
                            <td>75%</td>
                            <td style={{ color: 'green' }}>↑ 3%</td>
                        </tr>
                        <tr>
                            <td>Average Service Value</td>
                            <td>KES {(analytics.revenue / analytics.totalAppointments || 0).toFixed(2)}</td>
                            <td style={{ color: 'red' }}>↓ 2%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ title, value, icon }) {
    return (
        <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>{icon}</div>
            <h3 style={{ margin: '0', color: '#666' }}>{title}</h3>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#333' }}>{value}</div>
        </div>
    );
}