import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  if (!user) {
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
    <div className="account-tabs-container">
      <div className="account-header">
        <h1>My Account</h1>
        <p>Welcome back, {user.email}</p>
      </div>

      <div className="account-tabs">
        <div className="tabs-nav">
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

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>

      <div className="account-footer">
        <button onClick={logout} className="logout-btn">
          <span className="logout-icon">🚪</span>
          Logout
        </button>
      </div>
    </div>
  );
}

export default AccountTabs;