import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const adminLoginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
    const [loginError, setLoginError] = useState('');
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(adminLoginSchema),
    });

    const onSubmit = async (data) => {
        try {
            setLoginError('');
            const response = await axios.post("http://localhost:8081/admin/login", data);
            
            if (response.data.success) {
                // Store admin info in localStorage (optional)
                localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
                console.log("Admin login successful:", response.data);
                navigate("/admin/dashboard");
            }
        } catch (error) {
            console.error("Admin login failed:", error);
            if (error.response?.status === 401) {
                setLoginError("Invalid admin credentials. Please check your email and password.");
            } else {
                setLoginError("Login failed. Please try again.");
            }
        }
    };

    return (
        <section style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
            <h1>Admin Login</h1>
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <div>
                    <label htmlFor="email">Email:</label>
                    <input
                        {...register("email")}
                        type="email"
                        name="email"
                        placeholder="admin@groommate.com"
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            marginTop: "5px"
                        }}
                    />
                    {errors.email && (
                        <div className='errormsg' style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
                            {errors.email.message}
                        </div>
                    )}
                </div>

                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        {...register("password")}
                        type="password"
                        name="password"
                        style={{
                            width: "100%",
                            padding: "10px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            marginTop: "5px"
                        }}
                    />
                    {errors.password && (
                        <div className='errormsg' style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
                            {errors.password.message}
                        </div>
                    )}
                </div>

                {loginError && (
                    <div className='errormsg' style={{ color: "red", fontSize: "14px", textAlign: "center" }}>
                        {loginError}
                    </div>
                )}

                <button
                    disabled={isSubmitting}
                    type="submit"
                    style={{
                        padding: "12px",
                        backgroundColor: isSubmitting ? "#ccc" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        fontSize: "16px"
                    }}
                >
                    {isSubmitting ? "Logging in..." : "Login as Admin"}
                </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
                <p>
                    Need to register as admin?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/admin/register")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        Register here
                    </button>
                </p>
                <p>
                    Regular user?{" "}
                    <button
                        type="button"
                        onClick={() => navigate("/")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        User Login
                    </button>
                </p>
            </div>
        </section>
    );
}
