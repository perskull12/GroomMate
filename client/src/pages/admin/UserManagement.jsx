import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagement.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });

    // Fetch all users
    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8081/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Handle user creation/update
   const handleSubmit = async (e) => {
    e.preventDefault();
        try {
            if (editingUser) {
                // For editing, only send password if it's changed
                const updateData = {
                    username: formData.username,
                    email: formData.email,
                    role: formData.role
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }
                await axios.put(`http://localhost:8081/admin/users/${editingUser.id}`, updateData);
            } else {
                // For new user, send all fields including password
                await axios.post('http://localhost:8081/admin/users', formData);
            }
            
            setFormData({
                username: '',
                email: '',
                password: '',
                role: 'user'
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.error || 'Error saving user');
        }
    };

    // Handle user deletion
    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:8081/admin/users/${userId}`);
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    // Set up user for editing
    const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
        username: user.username,
        email: user.email,
        password: '', // Clear password when editing
        role: user.role
    });
};

    return (
        <div className="user-management">
            <h2>User Management</h2>
            
            {/* User Form */}
            <form onSubmit={handleSubmit} className="user-form">
                <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser} // Required only for new users
                    minLength="6"
                />
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit">
                    {editingUser ? 'Update User' : 'Create User'}
                </button>
                {editingUser && (
                    <button type="button" onClick={() => setEditingUser(null)}>
                        Cancel Edit
                    </button>
                )}
            </form>

            {/* Users Table */}
            <div className="users-table">
                <h3>All Users</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <button onClick={() => handleEdit(user)}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(user.id)}>
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