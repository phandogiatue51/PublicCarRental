import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  const { isAuthenticated, getCurrentUser, logout } = useAuth();
  
  const role = localStorage.getItem("userRole");
  const fullName = localStorage.getItem("fullName");
  const email = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("renterId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("email");
    localStorage.removeItem("phoneNumber");
    localStorage.removeItem("accountId");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("staffId");
    localStorage.removeItem("stationId");
    
    // Dispatch custom event to notify components of auth state change
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    
    navigate("/");
  };

  if (!isAuthenticated()) {
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
      {/* Main Content */}
      <div className="account-main">
        <div className="main-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountTabs;