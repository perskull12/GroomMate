import { Link } from "react-router-dom";
export default function NavComponent() {
    return(
        <nav style={{
                    position: 'absolute',
                    top: 100,
                    right: 150,
                    padding: '10px 20px',
                    display: 'flex',
                    gap: '10px', // Space between items
                    fontWeight: 'bold',
                    zIndex: 1000, // Ensures it stays above other content
                    background: 'white', // Optional background
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                    <Link to = "/home" >Home</Link>
                    <Link to = "/Feedback" >Reviews</Link>
                    <Link to = "/Notifications">Notifications</Link>
                </nav>
    );
}