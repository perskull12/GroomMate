import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";

export default function Feedback() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await axios.get("http://localhost:8081/reviews");
                setReviews(response.data);
            } catch (error) {
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    return (
            <>
                <Header />
                <section style={{ maxWidth: 600, margin: "2rem auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "2rem" }}>
                    <h2 style={{ textAlign: "center" }}>User Feedback</h2>
                    {loading ? (
                        <div>Loading reviews...</div>
                    ) : reviews.length === 0 ? (
                        <div style={{ textAlign: "center" }}>No reviews yet.</div>
                    ) : (
                        <ul style={{ listStyle: "none", padding: 0 }}>
                            {reviews.map((r, idx) => (
                                <li key={idx} style={{ marginBottom: "1.5rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
                                    <div style={{ fontWeight: 600, color: "#007bff" }}>
                                        {r.username || "Anonymous"}
                                    </div>
                                    <div style={{ color: "#ffc107", fontSize: "1.2rem" }}>
                                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                                    </div>
                                    <div style={{ margin: "0.5rem 0" }}>{r.review}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </>
    );
}