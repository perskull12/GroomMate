import React, { useState } from "react";
import axios from "axios";
import './Home.css';
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Home() {
    const [form, setForm] = useState({
        date: "",
        time: "",
        haircut: "",
        style: "",
        mpesa: ""
    });

    const navigate = useNavigate();

    const haircutOptions = [
        { value: "clean_shave", label: "Clean Shave", styles: ["Bald", "Low", "High"] },
        { value: "trim", label: "Trim", styles: ["Light Trim", "Medium Trim", "Heavy Trim"] },
        { value: "fade", label: "Fade", styles: ["Low Fade", "Mid Fade", "High Fade"] }
    ];

    const selectedHaircut = haircutOptions.find(opt => opt.value === form.haircut);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:8081/appointments",{...form,
                username: localStorage.getItem("username")
            });
            alert("Booking confirmed!");
            // Optionally reset form or redirect
            setForm({
                date: "",
                time: "",
                haircut: "",
                style: "",
                mpesa: ""
            });
        } catch (error) {
            alert("Booking failed. Please try again.");
            console.error("Booking error:", error.response?.data || error.message);
        }
    };

    return (
        <>
            <Header />
            <h1>BookingPage</h1>
            <form className="BookingCard" onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
                <label>
                    Select Date:
                    <input
                        id="bookingInput"
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                    />
                </label>
                <br /><br />
                <label>
                    Select Time:
                    <input
                        id="bookingInput"
                        type="time"
                        name="time"
                        value={form.time}
                        onChange={handleChange}
                        required
                    />
                </label>
                <br /><br />
                <label>
                    Type of Haircut:
                    <select
                        name="haircut"
                        value={form.haircut}
                        onChange={handleChange}
                        required
                    >
                        <option value="">--Select--</option>
                        {haircutOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </label>
                <br /><br />
                {form.haircut && (
                    <label>
                        Style:
                        <select
                            name="style"
                            value={form.style}
                            onChange={handleChange}
                            required
                        >
                            <option value="">--Select Style--</option>
                            {selectedHaircut.styles.map(style => (
                                <option key={style} value={style}>{style}</option>
                            ))}
                        </select>
                    </label>
                )}
                <br /><br />
                <label>
                    Mpesa Payment Number:
                    <input
                        id="bookingInput"
                        type="tel"
                        name="mpesa"
                        value={form.mpesa}
                        onChange={handleChange}
                        pattern="^07\d{8}$"
                        placeholder="07XXXXXXXX"
                        required
                    />
                </label>
                <br /><br />
                <button id="Confirm"type="submit">Confirm Booking & Pay</button>
            </form>
            <Link to ="/Review">Leave a Review?</Link>
            </>
        );
    }