# LocalStack Desktop 🚀

An AWS Console-style **installable desktop app** for LocalStack Pro.
Built with Electron + React + AWS SDK v3.

---

## 📦 Install (Pre-built)

After building, find your installer in `dist/`:

| Platform | File | How |
|----------|------|-----|
| **macOS Intel** | `LocalStack Desktop-1.0.0.dmg` | Drag to Applications |
| **macOS ARM** | `LocalStack Desktop-1.0.0-arm64.dmg` | Drag to Applications |
| **Windows** | `LocalStack Desktop Setup 1.0.0.exe` | Run installer |
| **Windows portable** | `LocalStack Desktop 1.0.0.exe` | Run directly |
| **Linux AppImage** | `LocalStack Desktop-1.0.0.AppImage` | `chmod +x` then run |
| **Linux deb** | `localstack-desktop_1.0.0_amd64.deb` | `sudo dpkg -i` |

---

## 🔨 Build from Source

**Requirements:** Node.js 18+

### macOS / Linux — one command
```bash
chmod +x build.sh
./build.sh          # current platform
./build.sh mac      # .dmg (Intel + Apple Silicon)
./build.sh linux    # .AppImage + .deb + .rpm
./build.sh win      # .exe (needs Wine on non-Windows)
```

### Windows — one command
```batch
build.bat
```

### Manual steps
```bash
npm install --legacy-peer-deps     # install deps
node scripts/generate-icons.js    # generate icon files
npm run dist                       # build React + package
```

---

## 🖥️ Development Mode (no install needed)

```bash
npm install --legacy-peer-deps
npm start
```

---

## ✨ Services (17 total)

| Category | Services |
|----------|---------|
| Storage | S3, DynamoDB, ElastiCache |
| Compute | Lambda, ECS |
| Messaging | SQS, SNS, Kinesis |
| Networking | API Gateway, Route 53 |
| Security | IAM, Cognito, Secrets Manager |
| Management | CloudWatch Logs, CloudFormation, Parameter Store |

---

## ⚙️ Default Connection

- Endpoint: `http://localhost:4566`
- Region: `us-east-1`
- Credentials: `test` / `test`

Change in **Settings** (gear icon, top-right).

---

## 🐳 Start LocalStack

```bash
localstack start                              # Community
LOCALSTACK_API_KEY=ls-xxx localstack start    # Pro
```

---

## ⌨️ Native App Menu Shortcuts

| Action | Shortcut |
|--------|----------|
| Dashboard | `Cmd/Ctrl+Shift+H` |
| Settings | `Cmd+,` (macOS) |
| Any service | **Services** menu in menu bar |
| Reload | `Cmd/Ctrl+R` |

---

## 🍎 macOS Gatekeeper

App is unsigned. To open after installing:
```
Right-click → Open → Open
```
Or: `xattr -cr "/Applications/LocalStack Desktop.app"`

## 🪟 Windows SmartScreen

Click **More info → Run anyway** on first launch.
