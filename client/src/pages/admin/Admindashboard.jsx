import { Link } from "react-router-dom";

// Simple AdminCard component
function AdminCard({ title, link, icon }) {
  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: "8px",
      padding: "20px",
      textAlign: "center",
      backgroundColor: "#f9f9f9",
      margin: "10px"
    }}>
      <div style={{ fontSize: "24px", marginBottom: "10px" }}>{icon}</div>
      <h3>{title}</h3>
      <Link to={link} style={{
        display: "inline-block",
        padding: "10px 20px",
        backgroundColor: "#007bff",
        color: "white",
        textDecoration: "none",
        borderRadius: "4px",
        marginTop: "10px"
      }}>
        Manage
      </Link>
    </div>
  );
}

// Simple icon components
function UsersIcon() {
  return <span>👥</span>;
}

function CalendarIcon() {
  return <span>📅</span>;
}

function GraphIcons() {
  return <span>📊</span>;
}

export default function AdminDashboard(){
  return (
    <div className="admin-container" style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <div className="admin-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginTop: "20px"
      }}>
        <AdminCard 
          title="User Management" 
          link="/admin/UserManagement"
          icon={<UsersIcon />}
        />
        <AdminCard
          title="Appointments"
          link="/admin/appointments"
          icon={<CalendarIcon />}
        />
        <AdminCard 
          title="Analytics"
          link=""
          icon={<GraphIcons />}
        />
      </div>
      <div style={{ marginTop: "30px" }}>
        <Link to="/" style={{
          padding: "10px 20px",
          backgroundColor: "#db2612ff",
          color: "white",
          textDecoration: "none",
          borderRadius: "4px"
        }}>
          Logout
        </Link>
      </div>
    </div>
  );
};
