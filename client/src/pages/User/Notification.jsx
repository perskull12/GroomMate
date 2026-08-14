import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";
import NavComponent from "./NavComponent";

export default function Notifications() {
    const [receipts, setReceipts] = useState([]);
    const [unread, setUnread] = useState(0);

    const getStatusColor = (status) => {
    switch(status) {
        case 'confirmed':
            return '#28a745';
        case 'completed':
            return '#007bff';
        case 'cancelled':
            return '#dc3545';
        default:
            return '#ffc107'; // pending
    }
};

    const fetchReceipts = async () => {
    try {
        const username = localStorage.getItem("username"); // Retrieve stored username from login
        if (!username) {
            console.error("No username found in localStorage");
            setReceipts([]);
            return;
        }

        const res = await axios.get("http://localhost:8081/notifications", {
            params: { username } // Send username as query param
        });

                setReceipts(res.data);
                setUnread(res.data.filter(r => r.status === "pending").length);
            } catch (error) {
                console.error("Error fetching receipts:", error);
                setReceipts([]);
            }
        };

        useEffect(() => {
            fetchReceipts();
        }, []);

        const handleUpdate = async (id) => {
            await axios.patch(`http://localhost:8081/notifications/${id}`);
            fetchReceipts();
        };

        const handleDelete = async (id) => {
            await axios.delete(`http://localhost:8081/notifications/${id}`);
            fetchReceipts();
        };


    return (
        <>
            <Header />
            <NavComponent />
                <section style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "2rem" }}>
                    <h2>
                        Notifications{" "}
                        <span style={{
                            background: "#ff3d00",
                            color: "#fff",
                            borderRadius: "50%",
                            padding: "0.3em 0.7em",
                            fontSize: "0.9em",
                            verticalAlign: "middle"
                        }}>
                            {unread}
                        </span>
                    </h2>
                    {receipts.length === 0 ? (
                        <div>No notifications yet.</div>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {receipts.map((r, idx) => (
                                <li key={r.id} style={{ 
                                    marginBottom: "1.5rem", 
                                    borderBottom: "1px solid #eee", 
                                    paddingBottom: "1rem" 
                                }}>
                                    <div style={{ fontWeight: 600, color: "#007bff" }}>
                                        Appointment Receipt
                                    </div>
                                    <div>Date: {r.date}</div>
                                    <div>Time: {r.time}</div>
                                    <div>Haircut: {r.haircut} ({r.style})</div>
                                    <div>Status: <span style={{ 
                                        color: getStatusColor(r.status),
                                        fontWeight: 'bold'
                                    }}>
                                        {r.status.toUpperCase()}
                                    </span></div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </>
    );
}