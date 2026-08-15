import React, { useState} from "react";
import { Link } from "react-router-dom";
import UserManagement from './UserManagement';
import AppointmentManagement from "./AppointmentManagement";
import SystemAnalytics from './SystemAnalytics';
import ServiceManagement from './ServiceManagement'
import Header from "../User/Header";
//icons
import { FaUsers } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa";
import { FaServer } from "react-icons/fa";
import { SiGoogleanalytics } from "react-icons/si";

function AdminCard({ title, icon, onClick }) {
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
      <button 
        onClick={onClick}
        style={{
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          textDecoration: "none",
          borderRadius: "4px",
          marginTop: "10px",
          cursor: "pointer"
        }}>
        Manage
      </button>
    </div>
  );
}

// Simple icon components
function UsersIcon() {
  return <span><FaUsers /></span>;
}

function CalendarIcon() {
  return <span><FaCalendar /></span>;
}

function GraphIcons() {
  return <span><SiGoogleanalytics /></span>;
}

function ServiceIcon() {
  return <span><FaServer /></span>;
}


export default function AdminDashboard(){
  const [activeComponent, setActiveComponent] = useState(null);

  const handleCardClick = (component) => {
    setActiveComponent(component);
  };

  return (
    <>
      <Header />
      <div className="admin-container" style={{ 
            width: "100%",
            padding: "32px",
            }}>
          <h1>Admin Dashboard</h1>
          
          {!activeComponent ? (
            <div className="admin-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
              width: "100%"
            }}>
              <AdminCard 
                title="User Management" 
                icon={<UsersIcon />}
                onClick={() => handleCardClick('users')}
              />
              <AdminCard
                title="Appointments"
                icon={<CalendarIcon />}
                onClick={() => handleCardClick('appointments')}
              />
              <AdminCard 
                title="Analytics"
                icon={<GraphIcons />}
                onClick={() => handleCardClick('analytics')}
              />
              <AdminCard 
                title="Services"
                icon={<ServiceIcon />}
                onClick={() => handleCardClick('services')}
              />
            </div>
          ) : (
            <div>
              <button 
                onClick={() => setActiveComponent(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  marginBottom: "20px",
                  cursor: "pointer"
                }}
              >
                Back to Dashboard
              </button>
              
              {activeComponent === 'users' && <UserManagement />}
              {activeComponent === 'appointments' && <AppointmentManagement />}
              {activeComponent === 'analytics' && <SystemAnalytics />}
              {activeComponent === 'services' && <ServiceManagement />}
            </div>
          )}

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
        </>
    );
}