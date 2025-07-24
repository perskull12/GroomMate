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
}).refine((data) => data.password === data.confirmPassword, {
    message: "Paawords must match",
    path: ["confirmPassword"],
});

export default function Register () {
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
            const { confirmPassword, ...userData } = data;
            const response = await axios.post("http://localhost:8081/groommate", userData);
            console.log("Registration successful:", response.data);
            navigate("/");
    }   catch (error) {
           console.error("Registration failed:", error.response?.data || error.message);
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
                            <button disabled={isSubmitting} id="Login/Register">{isSubmitting ? "Loading..." : "Register"}</button>
                </form>
                    {errors.root && <div className='errormsg'>{errors.root.message}</div>}
                    <p>
                        Returning user?<button type="button" onClick={() => navigate("/")}
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