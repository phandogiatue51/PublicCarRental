import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Profile from './Profile';
import Contract from './Contract';
import Invoice from './Invoice';
import Favorite from './Favorite';
import '../../styles/Account/AccountTabs.css';

// Define tabs configuration
const tabs = [
  {
    id: 'profile',
    label: 'Profile',
    icon: '👤',
    component: Profile
  },
  {
    id: 'contract',
    label: 'Contracts',
    icon: '📝',
    component: Contract
  },
  {
    id: 'invoice',
    label: 'Invoices',
    icon: '🧾',
    component: Invoice
  },
  {
    id: 'favorite',
    label: 'Favorites',
    icon: '❤️',
    component: Favorite
  }
];

function AccountTabs() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  const role = sessionStorage.getItem("userRole");
  const fullName = sessionStorage.getItem("fullName");
  const email = sessionStorage.getItem("email");

  const handleLogout = () => {
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("renterId");
    sessionStorage.removeItem("fullName");
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("phoneNumber");
    navigate("/");
  };

  if (!role) {
    navigate("/login");
    return null;
  }

  // Function to render the active tab content
  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (activeTabConfig && activeTabConfig.component) {
      const TabComponent = activeTabConfig.component;
      return <TabComponent />;
    }
    return <div>Tab content not found</div>;
  };

  return (
    <div className="account-layout">
      {/* Sidebar */}
      <div className="account-sidebar">
        <div className="sidebar-header">
          <h2>My Account</h2>
          <p>Welcome back, {fullName || email || 'User'}</p>
        </div>
        
        <div className="sidebar-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="account-main">
        <div className="main-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default AccountTabs;