# CloudDock

An AWS Console-style **installable desktop app** for managing cloud service emulators.
Built with Electron + React + AWS SDK v3.

CloudDock is **backend-agnostic** — it works with any AWS-compatible endpoint, not just LocalStack.

---

## Supported Backends

| Backend | Port | Services | License | Notes |
|---------|------|----------|---------|-------|
| [LocalStack](https://docs.localstack.cloud) | 4566 | 80+ | Freemium | Full-featured AWS emulator. Some services require a paid plan. |
| [Floci](https://hectorvent.dev/floci) | 4566 | 25 | MIT (Free) | Starts in 24ms. No auth required. |
| [MiniStack](https://ministack.org) | 4566 | 34 | MIT (Free) | Real containers for RDS/ElastiCache. |
| [Moto](https://docs.getmoto.org/en/latest/docs/server_mode.html) | 5000 | 100+ | Apache 2.0 (Free) | In-memory mock. Best for unit testing. |
| **Custom** | Any | — | — | Any AWS-compatible HTTP endpoint. |

## Quick Start

### 1. Start a backend

Pick any backend and start it with Docker:

**LocalStack** (most popular)
```bash
docker run --rm -p 4566:4566 localstack/localstack
```

**Floci** (fastest startup)
```bash
docker run --rm -p 4566:4566 hectorvent/floci:latest
```

**MiniStack** (real container services)
```bash
docker run --rm -p 4566:4566 nahuelnucera/ministack
```

**Moto** (lightweight mock)
```bash
docker run --rm -p 5000:5000 motoserver/moto:latest
```

### 2. Launch CloudDock

**Development mode** (no build needed):
```bash
npm install --legacy-peer-deps
npm start
```

CloudDock auto-detects which backend is running and adjusts the available services accordingly.

### 3. Configure (optional)

Open **Settings** (gear icon or Cmd+,) to change:
- Endpoint URL (default: `http://localhost:4566`)
- AWS Region (default: `us-east-1`)
- Credentials (default: `test` / `test`)
- Backend type (auto-detected, or set manually)

---

## Features

- **25+ AWS services** with dedicated management pages
- **Multi-backend support** — auto-detects LocalStack, Moto, Floci, MiniStack, or custom endpoints
- **Dark & light themes** with system preference detection
- **Command palette** (Cmd+K / Ctrl+K) for quick navigation
- **Deep-linking** — URLs like `#/s3` and `#/dynamodb` support bookmarks and browser history
- **Accessible** — WCAG AA compliant with keyboard navigation and screen reader support
- **Secure** — credentials encrypted via OS keychain (Electron), sensitive values blurred by default
- **Cross-platform** — macOS (Intel + Apple Silicon), Windows, Linux

## Services

| Category | Services |
|----------|---------|
| Storage | S3, DynamoDB, ElastiCache |
| Compute | Lambda, EC2, ECS, ECR |
| Messaging | SQS, SNS, Kinesis, Firehose, EventBridge, SES |
| Networking | API Gateway, Route 53, ACM |
| Security | IAM, Cognito, Secrets Manager, KMS, STS |
| Management | CloudWatch Logs, CloudFormation, Parameter Store, Step Functions |

Not all services are available on every backend. CloudDock shows only the services supported by your active backend.

---

## Build Installers

**Requirements:** Node.js 18+

### macOS / Linux

```bash
chmod +x build.sh
./build.sh          # current platform
./build.sh mac      # .dmg (Intel + Apple Silicon)
./build.sh linux    # .AppImage + .deb + .rpm
./build.sh win      # .exe (needs Wine on non-Windows)
```

### Windows

```batch
build.bat
```

Installers are output to the `dist/` directory.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | Cmd/Ctrl+K |
| Dashboard | Cmd/Ctrl+Shift+H |
| Settings | Cmd+, (macOS) |
| Any service | **Services** menu in menu bar |
| Reload | Cmd/Ctrl+R |

---

## macOS Gatekeeper

The app is unsigned. To open after installing:
```
Right-click → Open → Open
```
Or: `xattr -cr "/Applications/CloudDock.app"`

## Windows SmartScreen

Click **More info → Run anyway** on first launch.

---

## License

MIT
