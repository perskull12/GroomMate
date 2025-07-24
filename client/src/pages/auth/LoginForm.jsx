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
    const {register,
        handleSubmit,
        formState: { errors, isSubmitting},
    } = useForm({
        defaultValues:{

        },
        resolver: zodResolver(userSchema),
    })

         // Example usage in LoginForm.jsx
    const onSubmit = async (data) => {
        try {
            const response = await axios.post("http://localhost:8081/login", {
                email: data.email,
                password: data.password
            });
            // Handle successful login (e.g., save user, redirect)
            console.log("Login successful:", response.data);
            navigate("/home")
        } catch (error) {
            // Handle login error
            console.error("Login failed:", error.response?.data || error.message);
        }
};

    const navigate = useNavigate();

    return(
        <>
            <Header />  {/* Add Header component here */}
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