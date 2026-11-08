import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { DataSourcesPage } from './pages/DataSourcesPage';
import { DataAutomationPage } from './pages/DataAutomationPage';
import { DivisionAnalyticsPage } from './pages/DivisionAnalyticsPage';
import { SalesIntelligencePage } from './pages/SalesIntelligencePage';
import { PredictiveAnalyticsPage } from './pages/PredictiveAnalyticsPage';
import { BusinessDiscoveryPage } from './pages/BusinessDiscoveryPage';
import { CrossBusinessPage } from './pages/CrossBusinessPage';
import { NexusAIAssistantPage } from './pages/NexusAIAssistantPage';
import { DxRecommendationsPage } from './pages/DxRecommendationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { DataHealthPage } from './pages/DataHealthPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage onNavigate={setActiveTab} />;
      case 'data_sources':
        return <DataSourcesPage />;
      case 'data_automation':
        return <DataAutomationPage />;
      case 'division_analytics':
        return <DivisionAnalyticsPage />;
      case 'sales_intelligence':
        return <SalesIntelligencePage />;
      case 'predictive':
        return <PredictiveAnalyticsPage />;
      case 'discovery':
        return <BusinessDiscoveryPage />;
      case 'cross_business':
        return <CrossBusinessPage />;
      case 'assistant':
        return <NexusAIAssistantPage />;
      case 'dx':
        return <DxRecommendationsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'health':
        return <DataHealthPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
