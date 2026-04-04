/**
 * LocalStack Desktop — Electron Main Process
 *
 * SINGLE SOURCE OF TRUTH for the Electron main process.
 * `public/electron.js` is copied into `build/` by CRA during `npm run build:react`,
 * so electron-builder finds it at `build/electron.js` as expected.
 *
 * Do NOT edit `electron/main.js` — it is kept only as a symlink fallback for IDEs.
 */

const { app, BrowserWindow, shell, Menu, Tray, ipcMain, safeStorage } = require('electron');
const path = require('path');
const fs   = require('fs');

// ── Dev detection ──────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

// ── Single-instance lock ───────────────────────────────────────────────────────
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }

let mainWindow = null;
let tray       = null;

app.setName('LocalStack Desktop');
if (process.platform === 'darwin') {
  app.setAboutPanelOptions({
    applicationName: 'LocalStack Desktop',
    applicationVersion: app.getVersion(),
    copyright: 'Open Source — LocalStack Desktop',
  });
}

// ── Credential storage via safeStorage ────────────────────────────────────────
// Credentials are encrypted with the OS keychain (Keychain / DPAPI / libsecret).
// Falls back to plain storage in dev where safeStorage may not be available.

const CRED_KEYS = ['ls_endpoint','ls_region','ls_access_key','ls_secret_key'];
const credStore = {}; // in-memory cache after decrypt

function credPath() {
  return path.join(app.getPath('userData'), 'credentials.enc');
}

function loadCredentials() {
  try {
    const raw = fs.readFileSync(credPath(), 'utf8');
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      if (!v) continue;
      try {
        credStore[k] = safeStorage.isEncryptionAvailable()
          ? safeStorage.decryptString(Buffer.from(v, 'base64'))
          : v;
      } catch { credStore[k] = v; }
    }
  } catch { /* first run, no file yet */ }
}

function saveCredentials() {
  const toSave = {};
  for (const k of CRED_KEYS) {
    if (!credStore[k]) continue;
    toSave[k] = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(credStore[k]).toString('base64')
      : credStore[k];
  }
  fs.writeFileSync(credPath(), JSON.stringify(toSave), 'utf8');
}

// IPC: renderer asks for a credential value
ipcMain.handle('cred:get', (_, key) => credStore[key] ?? null);

// IPC: renderer sets all credentials at once
ipcMain.handle('cred:set', (_, map) => {
  for (const [k, v] of Object.entries(map)) { credStore[k] = v; }
  saveCredentials();
  return true;
});

// IPC: renderer clears all credentials
ipcMain.handle('cred:clear', () => {
  for (const k of CRED_KEYS) { delete credStore[k]; }
  try { fs.unlinkSync(credPath()); } catch {}
  return true;
});

// ── Window creation ────────────────────────────────────────────────────────────
function getIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'assets', 'icon.png'),
    path.join(__dirname, 'assets', 'icon.png'),
    path.join(process.resourcesPath || '', 'assets', 'icon.png'),
    path.join(__dirname, 'logo512.png'),
  ];
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

function createWindow() {
  const iconPath = getIconPath();
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1100, minHeight: 700,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 14, y: 14 } : undefined,
    backgroundColor: '#0d1117',
    show: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
      webSecurity:      false,   // allow LocalStack HTTP calls from file://
    },
    icon:  iconPath || undefined,
    title: 'LocalStack Desktop',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  isDev
    ? mainWindow.loadURL('http://localhost:3000')
    : mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev && url.startsWith('http://localhost:3000')) return;
    if (url.startsWith('file://')) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Native menu ────────────────────────────────────────────────────────────────
function buildMenu() {
  const navigate = (id) =>
    mainWindow?.webContents.executeJavaScript(`window.__navigateTo && window.__navigateTo('${id}')`);

  const svcMenu = [
    { label: 'Dashboard', accelerator: 'CmdOrCtrl+Shift+H', click: () => navigate('dashboard') },
    { type: 'separator' },
    // Storage
    { label: 'S3', click: () => navigate('s3') },
    { label: 'DynamoDB', click: () => navigate('dynamodb') },
    { label: 'ElastiCache (Pro)', click: () => navigate('elasticache') },
    { label: 'RDS (Pro)', click: () => navigate('rds') },
    { label: 'Redshift (Pro)', click: () => navigate('redshift') },
    { type: 'separator' },
    // Compute
    { label: 'Lambda', click: () => navigate('lambda') },
    { label: 'EC2', click: () => navigate('ec2') },
    { label: 'ECS (Pro)', click: () => navigate('ecs') },
    { label: 'EKS (Pro)', click: () => navigate('eks') },
    { label: 'ECR', click: () => navigate('ecr') },
    { label: 'Batch (Pro)', click: () => navigate('batch') },
    { label: 'SageMaker (Pro)', click: () => navigate('sagemaker') },
    { type: 'separator' },
    // Messaging
    { label: 'SQS', click: () => navigate('sqs') },
    { label: 'SNS', click: () => navigate('sns') },
    { label: 'Kinesis', click: () => navigate('kinesis') },
    { label: 'Firehose', click: () => navigate('firehose') },
    { label: 'EventBridge', click: () => navigate('eventbridge') },
    { label: 'MSK / Kafka (Pro)', click: () => navigate('msk') },
    { label: 'SES', click: () => navigate('ses') },
    { label: 'IoT Core (Pro)', click: () => navigate('iot') },
    { type: 'separator' },
    // Networking
    { label: 'API Gateway', click: () => navigate('apigateway') },
    { label: 'Route 53', click: () => navigate('route53') },
    { label: 'ACM', click: () => navigate('acm') },
    { label: 'CloudFront (Pro)', click: () => navigate('cloudfront') },
    { label: 'WAF (Pro)', click: () => navigate('waf') },
    { type: 'separator' },
    // Security
    { label: 'IAM', click: () => navigate('iam') },
    { label: 'Cognito (Pro)', click: () => navigate('cognito') },
    { label: 'Secrets Manager', click: () => navigate('secrets') },
    { label: 'KMS', click: () => navigate('kms') },
    { label: 'STS', click: () => navigate('sts') },
    { type: 'separator' },
    // Management
    { label: 'CloudWatch', click: () => navigate('cloudwatch') },
    { label: 'CloudFormation', click: () => navigate('cloudformation') },
    { label: 'Parameter Store (SSM)', click: () => navigate('ssm') },
    { label: 'Step Functions', click: () => navigate('stepfunctions') },
    { label: 'CodePipeline (Pro)', click: () => navigate('codepipeline') },
    { type: 'separator' },
    // Analytics
    { label: 'Athena (Pro)', click: () => navigate('athena') },
    { label: 'Glue (Pro)', click: () => navigate('glue') },
    { label: 'OpenSearch (Pro)', click: () => navigate('opensearch') },
    { label: 'Timestream (Pro)', click: () => navigate('timestream') },
  ];

  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { label: 'Settings…', accelerator: 'Cmd+,', click: () => navigate('settings') },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    { label: 'Services', submenu: svcMenu },
    {
      label: 'View',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' }, { role: 'zoom' },
        ...(process.platform === 'darwin' ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'LocalStack Docs',    click: () => shell.openExternal('https://docs.localstack.cloud') },
        { label: 'LocalStack Console', click: () => shell.openExternal('https://app.localstack.cloud') },
        { type: 'separator' },
        { label: 'Report Issue', click: () => shell.openExternal('https://github.com/localstack/localstack/issues') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Tray (Windows / Linux) ─────────────────────────────────────────────────────
function createTray() {
  if (process.platform === 'darwin') return;
  const iconPath = getIconPath();
  if (!iconPath) return;
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('LocalStack Desktop');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Show LocalStack Desktop', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]));
    tray.on('double-click', () => { mainWindow?.show(); mainWindow?.focus(); });
  } catch {}
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  loadCredentials();
  createWindow();
  buildMenu();
  createTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { tray?.destroy(); });
