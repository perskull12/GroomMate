import { useState } from 'react';
import './Register.css';
import { useForm } from 'react-hook-form'
import {z} from 'zod'
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import Header from '../User/Header';
import axios from 'axios'

const userSchema = z.object({
    username:z.string().min(5, "Username must be atleast 5 chars"),
    email:z.string().email(),
    password:z.string().min(8, "Password must be atleast 8 characters"),
    confirmPassword:z.string().min(8, "Confirm password must same as Password"),
    adminCode:z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Paawords must match",
    path: ["confirmPassword"],
});

export default function Register () {
    const [showAdminCode, setShowAdminCode] = useState(false);
    
    const {register,
        handleSubmit,
        formState: { errors, isSubmitting},
    } = useForm({
        defaultValues: {
            username:""
        },
        resolver: zodResolver(userSchema),
    })

    const onSubmit = async (data) => {
       try {
            const { confirmPassword, adminCode, ...userData } = data;
            
            // Check if admin code is provided
            if (adminCode && adminCode.trim() !== "") {
                // Register as admin
                const response = await axios.post("http://localhost:8081/admin/register", {
                    ...userData,
                    adminCode: adminCode
                });
                
                if (response.data.success) {
                    console.log("Admin registration successful:", response.data);
                    alert("Admin registration successful! You can now login with your credentials.");
                    navigate("/");
                } else {
                    throw new Error("Registration failed");
                }
            } else {
                // Register as regular user
                const response = await axios.post("http://localhost:8081/groommate", userData);
                
                if (response.data.success) {
                    console.log("User registration successful:", response.data);
                    alert("Registration successful! You can now login with your credentials.");
                    navigate("/");
                } else {
                    throw new Error("Registration failed");
                }
            }
    }   catch (error) {
           console.error("Registration failed:", error.response?.data || error.message);
           if (error.response?.status === 403) {
               alert("Invalid admin code. Please check your admin code and try again.");
           } else if (error.response?.status === 500) {
               alert("Database error. Please try again later.");
           } else {
               alert("Registration failed. Please check your information and try again.");
           }
    }
    }

    const navigate = useNavigate();
    
    return(
        <>
            <Header />
            <section>
                <h1>Register</h1>
                <form id="register" onSubmit={handleSubmit(onSubmit)}>
                    <label htmlFor="username">Username:</label>
                    <input {...register("username")} type="text" name="username" placeholder="John schmoe"/>
                        {errors.username && (
                            <div className='errormsg'>{errors.username.message}</div>
                        )}
                    <label htmlFor="email">Email:</label>
                    <input {...register("email")} type="email" name="email" placeholder="Johnschmoe@gmail.com"/>
                        {errors.email && (
                            <div className='errormsg'>{errors.email.message}</div>
                        )}
                    <label htmlFor="Password">Password:</label>
                    <input {...register("password")} type="password" name="password" />
                        {errors.password && (
                            <div className='errormsg'>{errors.password.message}</div>
                        )}
                    <label htmlFor="confirm password">Confrim Password:</label>
                    <input {...register("confirmPassword")} type="password" name="confirmPassword" />
                        {errors.confirmPassword && (
                            <div className='errormsg'>{errors.confirmPassword.message}</div>
                        )}
                    
                    <div style={{ margin: "15px 0" }}>
                        <label>
                            <input 
                                type="checkbox" 
                                checked={showAdminCode}
                                onChange={(e) => setShowAdminCode(e.target.checked)}
                                style={{ marginRight: "8px" }}
                            />
                            Register as Admin
                        </label>
                    </div>

                    {showAdminCode && (
                        <>
                            <label htmlFor="adminCode">Admin Code:</label>
                            <input 
                                {...register("adminCode")} 
                                type="password" 
                                name="adminCode" 
                                placeholder="Enter admin code"
                            />
                            {errors.adminCode && (
                                <div className='errormsg'>{errors.adminCode.message}</div>
                            )}
                        </>
                    )}

                    <button disabled={isSubmitting} id="Login/Register">
                        {isSubmitting ? "Loading..." : (showAdminCode ? "Register as Admin" : "Register")}
                    </button>
                </form>
                    {errors.root && <div className='errormsg'>{errors.root.message}</div>}
                    <p>
                        Returning user?
                        <button type="button" onClick={() => navigate("/")}
                            style={{
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}>Login</button>
                    </p>
            </section>
        </>
    )
}
