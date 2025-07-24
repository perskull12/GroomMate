import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "./Header";  

export default function Review() {
    const [review, setReview] = useState("");
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const navigate = useNavigate();

    const username = localStorage.getItem("username") || "Anonymous";
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:8081/reviews", {
                review,
                rating,
                username
            });
            setSubmitted(true);
        } catch (error) {
            alert("Failed to submit review.");
            console.error("Review error:", error.response?.data || error.message);
        }
    };

    return (
        <>
            <Header />
            <section style={{ maxWidth: 400, margin: "2rem auto", background: "#fff", borderRadius: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", padding: "2rem" }}>
                <h2>Leave a Review</h2>
                {submitted ? (
                    <div style={{ color: "green", textAlign: "center" }}>
                        Thank you for your feedback!
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <label>
                            Your Review:
                            <textarea
                                value={review}
                                onChange={e => setReview(e.target.value)}
                                rows={3}
                                maxLength={200}
                                placeholder="Share your experience..."
                                required
                                style={{ width: "100%", padding: "0.7rem", borderRadius: 5, border: "1px solid #bbb", marginTop: 5 }}
                            />
                        </label>
                        <label>
                            Star Rating:
                            <div style={{ fontSize: "1.5rem", marginTop: 5 }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        style={{
                                            cursor: "pointer",
                                            color: rating >= star ? "#ffc107" : "#bbb"
                                        }}
                                        onClick={() => setRating(star)}
                                        role="button"
                                        aria-label={`${star} star`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>
                        </label>
                        <button
                            className="review-link"
                            type="submit" 
                            style={{ 
                                //background: "#657cabff",
                                color: "black",
                                border: "solid",
                                borderColor: "ActiveBorder",
                                borderRadius: 5,
                                padding: 0,
                                fontWeight: 600,
                                cursor: "pointer",
                                }}>
                            Submit Review
                        </button>
                    </form>
                        )}
                    </section>
            </>
            
        )}