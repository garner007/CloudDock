# CloudDock

An AWS Console-style **installable desktop app** for managing cloud service emulators.
Built with Electron + React + AWS SDK v3. Supports LocalStack, Moto, Floci, MiniStack, and custom endpoints.

---

## Features

- **25+ AWS services** with dedicated management pages
- **Multi-backend support** — LocalStack, Moto, Floci, MiniStack, custom endpoints
- **Dark & light themes** with system preference detection
- **Command palette** (Cmd+K / Ctrl+K) for quick navigation
- **Hash-based routing** with deep-linking support
- **Accessible** — WCAG AA compliant with keyboard navigation
- **Cross-platform** — macOS, Windows, Linux

## Services

| Category | Services |
|----------|---------|
| Storage | S3, DynamoDB, ElastiCache |
| Compute | Lambda, EC2, ECS, ECR |
| Messaging | SQS, SNS, Kinesis, Firehose, EventBridge, SES |
| Networking | API Gateway, Route 53, ACM |
| Security | IAM, Cognito, Secrets Manager, KMS, STS |
| Management | CloudWatch Logs, CloudFormation, Parameter Store, Step Functions |

## Install

### Build from Source

**Requirements:** Node.js 18+

```bash
npm install --legacy-peer-deps
npm start                    # dev mode (Electron + React)
npm run dist                 # build installer for current platform
```

### Platform-specific builds

```bash
./build.sh mac     # .dmg (Intel + Apple Silicon)
./build.sh linux   # .AppImage + .deb + .rpm
./build.sh win     # .exe (needs Wine on non-Windows)
```

## Default Connection

- Endpoint: `http://localhost:4566`
- Region: `us-east-1`
- Credentials: `test` / `test`

Change in **Settings** (gear icon or Cmd+,).

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | Cmd/Ctrl+K |
| Dashboard | Cmd/Ctrl+Shift+H |
| Settings | Cmd+, (macOS) |
| Reload | Cmd/Ctrl+R |

## License

MIT
