import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";

export default function Notifications() {
    const [receipts, setReceipts] = useState([]);
    const [unread, setUnread] = useState(0);

    const fetchReceipts = async () => {
        try {
            const res = await axios.get("http://localhost:8081/notifications");
            setReceipts(res.data);
            setUnread(res.data.filter(r => r.status === "pending").length);
        } catch {
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
                                <li key={r.id} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                                    <div style={{ fontWeight: 600, color: "#007bff" }}>
                                        Appointment Receipt
                                    </div>
                                    <div>Date: {r.date}</div>
                                    <div>Time: {r.time}</div>
                                    <div>Haircut: {r.haircut} ({r.style})</div>
                                    <div>Mpesa No: {r.mpesa}</div>
                                    <div style={{ color: "#388e3c", marginTop: 5 }}>Your booking is confirmed!</div>
                                    {r.status === "pending" ? (
                                        <button
                                            style={{
                                                marginTop: "0.5rem",
                                                background: "#ff3d00",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 5,
                                                padding: "0.4rem 1rem",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => handleUpdate(r.id)}
                                        >
                                            Pending
                                        </button>
                                    ) : (
                                    <>
                                            <button
                                                style={{
                                                    marginTop: "0.5rem",
                                                    background: "#2dce1bff",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: 5,
                                                    padding: "0.4rem 1rem",
                                                    cursor: "not-allowed",
                                                    marginRight: "0.5rem"
                                                }}
                                                disabled
                                            >
                                                Done
                                            </button>
                                            <button
                                                style={{
                                                    marginTop: "0.5rem",
                                                    background: "#b71c1c",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: 5,
                                                    padding: "0.4rem 1rem",
                                                    cursor: "pointer"
                                                }}
                                                onClick={() => handleDelete(r.id)}
                                            >
                                                Delete
                                            </button>
                                        </>
                                        
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </>
    );
}