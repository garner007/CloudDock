import React, { useState, useEffect, useCallback } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Breadcrumb from './components/Breadcrumb';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import GenericServicePage from './components/GenericServicePage';

import S3Page from './pages/S3Page';
import DynamoDBPage from './pages/DynamoDBPage';
import SQSPage from './pages/SQSPage';
import LambdaPage from './pages/LambdaPage';
import SNSPage from './pages/SNSPage';
import IAMPage from './pages/IAMPage';
import CloudFormationPage from './pages/CloudFormationPage';
import SecretsPage from './pages/SecretsPage';
import CloudWatchPage from './pages/CloudWatchPage';
import CognitoPage from './pages/CognitoPage';
import APIGatewayPage from './pages/APIGatewayPage';
import KinesisPage from './pages/KinesisPage';
import SSMPage from './pages/SSMPage';
import Route53Page from './pages/Route53Page';
import ECSPage from './pages/ECSPage';
import ElastiCachePage from './pages/ElastiCachePage';
import EC2Page from './pages/EC2Page';
import KMSPage from './pages/KMSPage';
import SESPage from './pages/SESPage';
import EventBridgePage from './pages/EventBridgePage';
import StepFunctionsPage from './pages/StepFunctionsPage';
import ECRPage from './pages/ECRPage';
import ACMPage from './pages/ACMPage';
import FirehosePage from './pages/FirehosePage';
import STSPage from './pages/STSPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';

import SERVICES from './services/catalog';
import { useTheme } from './hooks/useTheme';
import { useDensity } from './hooks/useDensity';
import { checkBackendHealth, BACKENDS } from './services/backends';
import './App.css';

const PAGE_MAP = {
  s3: S3Page, dynamodb: DynamoDBPage, sqs: SQSPage, lambda: LambdaPage,
  sns: SNSPage, iam: IAMPage, cloudformation: CloudFormationPage,
  secrets: SecretsPage, cloudwatch: CloudWatchPage, cognito: CognitoPage,
  apigateway: APIGatewayPage, kinesis: KinesisPage, ssm: SSMPage,
  route53: Route53Page, ecs: ECSPage, elasticache: ElastiCachePage,
  ec2: EC2Page, kms: KMSPage, ses: SESPage, eventbridge: EventBridgePage,
  stepfunctions: StepFunctionsPage, ecr: ECRPage, acm: ACMPage,
  firehose: FirehosePage, sts: STSPage,
  dashboard: DashboardPage, settings: SettingsPage,
};


export default function App() {
  const [currentService, setCurrentService] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pageTrail, setPageTrail] = useState([]);

  // Navigate to a service and clear the trail
  const navigateTo = useCallback((id) => {
    setCurrentService(id);
    setPageTrail([]);
  }, []);

  // Theme and density
  const { preference: themePref, resolved: themeResolved, setTheme } = useTheme();
  const { density, setDensity } = useDensity();

  const checkHealth = useCallback(async () => {
    const endpoint  = localStorage.getItem('ls_endpoint') || 'http://localhost:4566';
    const backendId = localStorage.getItem('ls_backend')  || 'localstack';
    setCheckingHealth(true);
    try {
      const result = await checkBackendHealth(endpoint, backendId);
      setHealth(result);
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const iv = setInterval(checkHealth, 15000);
    return () => clearInterval(iv);
  }, [checkHealth]);

  // Expose navigation bridge for Electron native menu
  useEffect(() => {
    // Support Electron native menu navigation via IPC
    if (window.electronAPI?.onNavigate) {
      window.electronAPI.onNavigate((id) => navigateTo(id));
    }
    // Fallback for non-Electron environments (kept for dev mode)
    window.__navigateTo = (id) => navigateTo(id);
    return () => { delete window.__navigateTo; };
  }, [navigateTo]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const showNotification = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  const renderPage = () => {
    if (currentService === 'dashboard')
      return <DashboardPage health={health} showNotification={showNotification} onNavigate={navigateTo} />;
    if (currentService === 'settings')
      return <SettingsPage health={health} showNotification={showNotification}
               themePref={themePref} setTheme={setTheme}
               density={density} setDensity={setDensity} />;

    const DedicatedPage = PAGE_MAP[currentService];
    if (DedicatedPage)
      return <DedicatedPage health={health} showNotification={showNotification}
               onNavigate={navigateTo} setPageTrail={setPageTrail} />;

    const svc = SERVICES.find(s => s.id === currentService);
    if (svc)
      return <GenericServicePage serviceId={currentService} health={health} showNotification={showNotification} />;

    return <DashboardPage health={health} showNotification={showNotification} onNavigate={navigateTo} />;
  };

  return (
    <SettingsProvider>
    <div className="app-shell">
      <TopBar
        health={health}
        checkingHealth={checkingHealth}
        onRefreshHealth={checkHealth}
        onNavigate={navigateTo}
        currentService={currentService}
        onOpenPalette={() => setPaletteOpen(true)}
        themePref={themePref}
        themeResolved={themeResolved}
        setTheme={setTheme}
      />
      <Breadcrumb currentService={currentService} onNavigate={navigateTo} pageTrail={pageTrail} />
      <div className="app-body">
        <Sidebar
          currentService={currentService}
          onNavigate={navigateTo}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />
        <main className="app-content">
          <ErrorBoundary serviceName={currentService} key={currentService}>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigateTo}
      />

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? '✓' : '✕'} {notification.msg}
        </div>
      )}
    </div>
    </SettingsProvider>
  );
}
