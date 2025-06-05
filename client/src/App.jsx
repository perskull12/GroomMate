import React from "react";
import { useState } from "react"
import LoginForm from "./pages/auth/LoginForm"
import Register from "./pages/auth/LoginForm"


export default function App() {
    const [currentPage, setCurrentPage] = useState("login")

    function handlePageChange(page){
        setCurrentPage(page)

    }
    return (
        <>
        <header>
            <h1>GroomMate</h1>
            <img src="src/assets/logo.png" alt="logo"/>
        </header>
        <main className="main">
            {currentPage === "login" ? <LoginForm /> : <Register />}
            <hr/>
            <p>Welcome to GroomMate where you can book your barbershop appointments</p>
            <p>Are u a new user?<button id="btn1" onClick={() => handlePageChange("Register")}>Register</button></p>
            <p>Returning user?<button id="btn1" onClick={() => handlePageChange("login")}>Login</button></p>
        </main>
        
        </>
    )
}