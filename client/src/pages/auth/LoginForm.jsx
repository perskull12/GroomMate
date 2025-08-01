import { useState } from 'react';
import './login.css';
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import Header from '../User/Header';
import axios from 'axios'

const userSchema = z.object({
    email:z.string().email(),
    password:z.string().min(8,"Input your password"),
})

export default function Login() {
    const [loginError, setLoginError] = useState('');
    
    const {register,
        handleSubmit,
        formState: { errors, isSubmitting},
    } = useForm({
        defaultValues:{

        },
        resolver: zodResolver(userSchema),
    })

        const onSubmit = async (data) => {
    try {
        setLoginError(''); // Clear previous errors
        const response = await axios.post("http://localhost:8081/login", {
            email: data.email,
            password: data.password
        });
        
        if (response.data.success) {
            const { user } = response.data;
            
            // Set all required localStorage items
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', user.username);
            
            console.log("Login successful:", response.data);
            
            // Role-based routing
            if (user.role === 'admin') {
                navigate("/admin/dashboard");
            } else {
                navigate("/home");
            }
        }
    } catch (error) {
        console.error("Login failed:", error.response?.data || error.message);
        if (error.response?.status === 401) {
            setLoginError("Invalid email or password. Please check your credentials.");
        } else {
            setLoginError("Login failed. Please try again.");
        }
    }
};

    const navigate = useNavigate();

    return(
        <>
            <Header />
            <section className="login-container">
                <h1>Login Form</h1>
                
                <form onSubmit={handleSubmit(onSubmit)} id="LoginForm">
                    <label htmlFor="email">Email:</label>
                    <input 
                        {...register("email")} 
                        type="email" 
                        name="email" 
                        placeholder="gmail.com"
                    />
                    {errors.email && (
                        <div className='errormsg'>{errors.email.message}</div>
                    )}

                    <label htmlFor="password">Password:</label>
                    <input 
                        {...register("password")} 
                        type="password" 
                        name="password" 
                    />
                    {errors.password && (
                        <div className='errormsg'>{errors.password.message}</div>
                    )}
                        {loginError && <div className="errormsg">{loginError}</div>}
                    <button 
                        disabled={isSubmitting} 
                        id="Login/Register"
                    >
                        {isSubmitting ? "Loading" : "Login"}
                    </button>
                </form>

                {errors.root && <div className='errormsg'>{errors.root.message}</div>}

                <p className="register-prompt">
                    Are you a new user?
                    <button 
                        type="button" 
                        onClick={() => navigate("/register")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#007bff",
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        Register
                    </button>
                </p>
            </section>
        </>
        
    )
}
