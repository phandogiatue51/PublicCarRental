import React, { useState, useEffect } from 'react';
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
  const { isAuthenticated, getCurrentUser } = useAuth();

  // Check authentication and get user data
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Optionally fetch current user if needed in future
    getCurrentUser();
  }, [isAuthenticated, navigate, getCurrentUser]);

  // Show nothing while checking authentication
  if (!isAuthenticated()) {
    return null;
  }

  // Function to render the active tab content
  const renderTabContent = () => {
    const activeTabConfig = tabs.find(tab => tab.id === activeTab);
    if (activeTabConfig && activeTabConfig.component) {
      const TabComponent = activeTabConfig.component;
      return <TabComponent />;
    }
    return (
      <div className="tab-not-found">
        <h3>Tab content not found</h3>
        <p>Please select a valid tab from the navigation.</p>
      </div>
    );
  };

  return (
    <div className="account-layout">
      {/* Main Content */}
      <div className="account-main">
        <div className="main-content">
          {/* Header */}
          <div className="account-header">
            <h1>My Account</h1>
            <p>Manage your profile, contracts, and invoices</p>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content" role="tabpanel">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountTabs;