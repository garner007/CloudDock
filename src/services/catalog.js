/**
 * SERVICE_CATALOG — Complete LocalStack AWS service registry
 * Source: https://docs.localstack.cloud/aws/services/
 * 99 services as of 2026
 *
 * tier: 'hobby'    → free (Hobby plan / non-commercial)
 * tier: 'base'     → requires Base plan or higher
 * tier: 'ultimate' → requires Ultimate plan or higher
 *
 * proOnly: true  = requires a paid plan (base or ultimate)
 * proOnly: false = available on Hobby (free) plan
 *
 * page: string   → dedicated page component ID
 * page: null     → uses GenericServicePage
 */

export const SERVICE_CATALOG = [

  // ── Storage ───────────────────────────────────────────────────────────────────
  {
    id: 's3', label: 'S3', sub: 'Simple Storage Service', group: 'Storage',
    emoji: '🪣', tier: 'hobby', proOnly: false, page: 'S3Page', healthKey: 's3',
    sdkPackage: '@aws-sdk/client-s3',
    description: 'Object storage for any amount of data. Store and retrieve files, host static websites, and serve content globally.',
  },
  {
    id: 's3tables', label: 'S3 Tables', sub: 'Managed Iceberg Tables', group: 'Storage',
    emoji: '📋', tier: 'base', proOnly: true, page: null, healthKey: 's3tables',
    sdkPackage: '@aws-sdk/client-s3tables',
    description: 'Purpose-built storage for tabular data with Apache Iceberg compatibility, optimized for analytics workloads.',
  },
  {
    id: 'dynamodb', label: 'DynamoDB', sub: 'NoSQL Database', group: 'Storage',
    emoji: '📊', tier: 'hobby', proOnly: false, page: 'DynamoDBPage', healthKey: 'dynamodb',
    sdkPackage: '@aws-sdk/client-dynamodb',
    description: 'Fully managed NoSQL key-value and document database delivering single-digit millisecond performance at any scale.',
  },
  {
    id: 'dynamodbstreams', label: 'DynamoDB Streams', sub: 'Change Data Capture', group: 'Storage',
    emoji: '🔁', tier: 'hobby', proOnly: false, page: null, healthKey: 'dynamodbstreams',
    sdkPackage: '@aws-sdk/client-dynamodb-streams',
    description: 'Capture table activity in DynamoDB. Stream item-level modifications in near real time.',
  },
  {
    id: 'elasticache', label: 'ElastiCache', sub: 'Redis / Memcached', group: 'Storage',
    emoji: '⚡', tier: 'base', proOnly: true, page: 'ElastiCachePage', healthKey: 'elasticache',
    sdkPackage: '@aws-sdk/client-elasticache',
    description: 'Managed in-memory caching with Redis and Memcached for microsecond response times.',
  },
  {
    id: 'memorydb', label: 'MemoryDB', sub: 'Redis-Compatible DB', group: 'Storage',
    emoji: '🧠', tier: 'base', proOnly: true, page: null, healthKey: 'memorydb',
    sdkPackage: '@aws-sdk/client-memory-db',
    description: 'Redis-compatible, durable, in-memory database that delivers ultra-fast performance with Multi-AZ durability.',
  },
  {
    id: 'rds', label: 'RDS', sub: 'Relational Database', group: 'Storage',
    emoji: '🗄️', tier: 'base', proOnly: true, page: null, healthKey: 'rds',
    sdkPackage: '@aws-sdk/client-rds',
    description: 'Managed relational database service supporting MySQL, PostgreSQL, MariaDB, Oracle, and SQL Server.',
  },
  {
    id: 'docdb', label: 'DocumentDB', sub: 'MongoDB-compatible', group: 'Storage',
    emoji: '📄', tier: 'base', proOnly: true, page: null, healthKey: 'docdb',
    sdkPackage: '@aws-sdk/client-docdb',
    description: 'MongoDB-compatible managed document database designed for JSON workloads.',
  },
  {
    id: 'neptune', label: 'Neptune', sub: 'Graph Database', group: 'Storage',
    emoji: '🕸️', tier: 'base', proOnly: true, page: null, healthKey: 'neptune',
    sdkPackage: '@aws-sdk/client-neptune',
    description: 'Fast, reliable, fully managed graph database for highly connected datasets.',
  },
  {
    id: 'redshift', label: 'Redshift', sub: 'Data Warehouse', group: 'Storage',
    emoji: '🔴', tier: 'base', proOnly: true, page: null, healthKey: 'redshift',
    sdkPackage: '@aws-sdk/client-redshift',
    description: 'Cloud data warehouse for analytic workloads. Run SQL queries against petabytes of structured data.',
  },
  {
    id: 'efs', label: 'EFS', sub: 'Elastic File System', group: 'Storage',
    emoji: '📂', tier: 'base', proOnly: true, page: null, healthKey: 'efs',
    sdkPackage: '@aws-sdk/client-efs',
    description: 'Serverless, fully elastic file system for use with AWS Cloud services and on-premises resources.',
  },
  {
    id: 'glacier', label: 'Glacier', sub: 'Cold Storage Archive', group: 'Storage',
    emoji: '🧊', tier: 'hobby', proOnly: false, page: null, healthKey: 'glacier',
    sdkPackage: '@aws-sdk/client-glacier',
    description: 'Low-cost archive storage with security for data archiving and long-term backup.',
  },
  {
    id: 'backup', label: 'Backup', sub: 'Centralized Backup', group: 'Storage',
    emoji: '💾', tier: 'base', proOnly: true, page: null, healthKey: 'backup',
    sdkPackage: '@aws-sdk/client-backup',
    description: 'Centrally manage and automate backup scheduling, retention management, and monitoring across AWS services.',
  },
  {
    id: 'dms', label: 'DMS', sub: 'Database Migration', group: 'Storage',
    emoji: '🚛', tier: 'base', proOnly: true, page: null, healthKey: 'dms',
    sdkPackage: '@aws-sdk/client-database-migration-service',
    description: 'Migrate databases to AWS quickly and securely. Supports homogeneous and heterogeneous migrations.',
  },

  // ── Compute ───────────────────────────────────────────────────────────────────
  {
    id: 'lambda', label: 'Lambda', sub: 'Serverless Functions', group: 'Compute',
    emoji: 'λ', tier: 'hobby', proOnly: false, page: 'LambdaPage', healthKey: 'lambda',
    sdkPackage: '@aws-sdk/client-lambda',
    description: 'Run code without provisioning servers. Pay only for the compute time you consume.',
  },
  {
    id: 'ec2', label: 'EC2', sub: 'Virtual Servers', group: 'Compute',
    emoji: '🖥️', tier: 'hobby', proOnly: false, page: 'EC2Page', healthKey: 'ec2',
    sdkPackage: '@aws-sdk/client-ec2',
    description: 'Virtual servers in the cloud. Launch instances with your choice of CPU, memory, storage, and networking.',
  },
  {
    id: 'ecs', label: 'ECS', sub: 'Container Service', group: 'Compute',
    emoji: '🐳', tier: 'base', proOnly: true, page: 'ECSPage', healthKey: 'ecs',
    sdkPackage: '@aws-sdk/client-ecs',
    description: 'Fully managed container orchestration service. Run, stop, and manage Docker containers at scale.',
  },
  {
    id: 'eks', label: 'EKS', sub: 'Kubernetes Service', group: 'Compute',
    emoji: '☸️', tier: 'ultimate', proOnly: true, page: null, healthKey: 'eks',
    sdkPackage: '@aws-sdk/client-eks',
    description: 'Managed Kubernetes service. Deploy and manage containerized applications without Kubernetes expertise.',
  },
  {
    id: 'ecr', label: 'ECR', sub: 'Container Registry', group: 'Compute',
    emoji: '📦', tier: 'hobby', proOnly: false, page: 'ECRPage', healthKey: 'ecr',
    sdkPackage: '@aws-sdk/client-ecr',
    description: 'Fully managed Docker container registry. Store, manage, and deploy container images securely.',
  },
  {
    id: 'elasticbeanstalk', label: 'Elastic Beanstalk', sub: 'App Deployment', group: 'Compute',
    emoji: '🫘', tier: 'base', proOnly: true, page: null, healthKey: 'elasticbeanstalk',
    sdkPackage: '@aws-sdk/client-elastic-beanstalk',
    description: 'Deploy and scale web apps and services with automatic provisioning of capacity, load balancing, and scaling.',
  },
  {
    id: 'batch', label: 'Batch', sub: 'Batch Computing', group: 'Compute',
    emoji: '⚙️', tier: 'base', proOnly: true, page: null, healthKey: 'batch',
    sdkPackage: '@aws-sdk/client-batch',
    description: 'Run batch computing jobs on AWS without managing infrastructure. Dynamically scale compute resources.',
  },
  {
    id: 'emr', label: 'EMR', sub: 'Big Data / Spark', group: 'Compute',
    emoji: '🔬', tier: 'base', proOnly: true, page: null, healthKey: 'emr',
    sdkPackage: '@aws-sdk/client-emr',
    description: 'Managed Hadoop framework for processing vast amounts of data using Spark, Hive, HBase, and more.',
  },
  {
    id: 'sagemaker', label: 'SageMaker', sub: 'Machine Learning', group: 'Compute',
    emoji: '🤖', tier: 'base', proOnly: true, page: null, healthKey: 'sagemaker',
    sdkPackage: '@aws-sdk/client-sagemaker',
    description: 'Fully managed service to build, train, and deploy machine learning models at scale.',
  },
  {
    id: 'bedrock', label: 'Bedrock', sub: 'Generative AI', group: 'Compute',
    emoji: '🪨', tier: 'base', proOnly: true, page: null, healthKey: 'bedrock',
    sdkPackage: '@aws-sdk/client-bedrock',
    description: 'Serverless access to foundation models from Amazon and leading AI companies via a single API.',
  },
  {
    id: 'autoscaling', label: 'Auto Scaling', sub: 'EC2 Auto Scaling', group: 'Compute',
    emoji: '📐', tier: 'hobby', proOnly: false, page: null, healthKey: 'autoscaling',
    sdkPackage: '@aws-sdk/client-auto-scaling',
    description: 'Automatically adjust EC2 capacity to maintain performance and minimize costs.',
  },
  {
    id: 'application-autoscaling', label: 'Application Auto Scaling', sub: 'Service Scaling', group: 'Compute',
    emoji: '📏', tier: 'hobby', proOnly: false, page: null, healthKey: 'application-autoscaling',
    sdkPackage: '@aws-sdk/client-application-auto-scaling',
    description: 'Configure automatic scaling for AWS services beyond EC2 — DynamoDB, ECS, Lambda, and more.',
  },
  {
    id: 'elb', label: 'ELB', sub: 'Elastic Load Balancing', group: 'Compute',
    emoji: '⚖️', tier: 'base', proOnly: true, page: null, healthKey: 'elb',
    sdkPackage: '@aws-sdk/client-elastic-load-balancing-v2',
    description: 'Distribute incoming traffic across multiple targets. Supports ALB, NLB, and CLB.',
  },
  {
    id: 'serverlessrepo', label: 'Serverless App Repo', sub: 'SAR', group: 'Compute',
    emoji: '🏪', tier: 'hobby', proOnly: false, page: null, healthKey: 'serverlessrepo',
    sdkPackage: '@aws-sdk/client-serverlessapplicationrepository',
    description: 'Discover, deploy, and publish serverless applications in the AWS Serverless Application Repository.',
  },

  // ── Messaging & Integration ───────────────────────────────────────────────────
  {
    id: 'sqs', label: 'SQS', sub: 'Simple Queue Service', group: 'Messaging',
    emoji: '📨', tier: 'hobby', proOnly: false, page: 'SQSPage', healthKey: 'sqs',
    sdkPackage: '@aws-sdk/client-sqs',
    description: 'Fully managed message queuing for microservices, distributed systems, and serverless applications.',
  },
  {
    id: 'sns', label: 'SNS', sub: 'Notification Service', group: 'Messaging',
    emoji: '📢', tier: 'hobby', proOnly: false, page: 'SNSPage', healthKey: 'sns',
    sdkPackage: '@aws-sdk/client-sns',
    description: 'Fully managed pub/sub messaging. Fan out notifications to Lambda, SQS, HTTP, email, and mobile.',
  },
  {
    id: 'kinesis', label: 'Kinesis', sub: 'Data Streams', group: 'Messaging',
    emoji: '🌊', tier: 'hobby', proOnly: false, page: 'KinesisPage', healthKey: 'kinesis',
    sdkPackage: '@aws-sdk/client-kinesis',
    description: 'Real-time streaming data service. Collect, process, and analyze data streams at any scale.',
  },
  {
    id: 'firehose', label: 'Data Firehose', sub: 'Stream Delivery', group: 'Messaging',
    emoji: '🚒', tier: 'hobby', proOnly: false, page: 'FirehosePage', healthKey: 'firehose',
    sdkPackage: '@aws-sdk/client-firehose',
    description: 'Reliably load streaming data into data lakes, warehouses, and analytics services at any scale.',
  },
  {
    id: 'eventbridge', label: 'EventBridge', sub: 'Event Bus', group: 'Messaging',
    emoji: '🔀', tier: 'hobby', proOnly: false, page: 'EventBridgePage', healthKey: 'events',
    sdkPackage: '@aws-sdk/client-eventbridge',
    description: 'Serverless event bus connecting applications with data from AWS services, SaaS, and custom sources.',
  },
  {
    id: 'eventbridge-pipes', label: 'EventBridge Pipes', sub: 'Point-to-Point Events', group: 'Messaging',
    emoji: '🔗', tier: 'base', proOnly: true, page: null, healthKey: 'pipes',
    sdkPackage: '@aws-sdk/client-pipes',
    description: 'Point-to-point integrations between event producers and consumers with optional filtering and enrichment.',
  },
  {
    id: 'eventbridge-scheduler', label: 'EventBridge Scheduler', sub: 'Scheduled Events', group: 'Messaging',
    emoji: '🗓️', tier: 'base', proOnly: true, page: null, healthKey: 'scheduler',
    sdkPackage: '@aws-sdk/client-scheduler',
    description: 'Create, run, and manage scheduled tasks at scale with one central managed service.',
  },
  {
    id: 'ses', label: 'SES', sub: 'Simple Email Service', group: 'Messaging',
    emoji: '📧', tier: 'hobby', proOnly: false, page: 'SESPage', healthKey: 'ses',
    sdkPackage: '@aws-sdk/client-ses',
    description: 'Cloud-based email sending and receiving service for marketing, transactional, and notification emails.',
  },
  {
    id: 'msk', label: 'MSK', sub: 'Managed Kafka', group: 'Messaging',
    emoji: '🐘', tier: 'base', proOnly: true, page: null, healthKey: 'kafka',
    sdkPackage: '@aws-sdk/client-kafka',
    description: 'Fully managed Apache Kafka service. Build and run real-time streaming data applications.',
  },
  {
    id: 'mq', label: 'MQ', sub: 'Managed Message Broker', group: 'Messaging',
    emoji: '📬', tier: 'base', proOnly: true, page: null, healthKey: 'mq',
    sdkPackage: '@aws-sdk/client-mq',
    description: 'Managed message broker service for Apache ActiveMQ and RabbitMQ.',
  },
  {
    id: 'kinesis-analytics', label: 'Managed Flink', sub: 'Apache Flink', group: 'Messaging',
    emoji: '⚡', tier: 'base', proOnly: true, page: null, healthKey: 'kinesisanalyticsv2',
    sdkPackage: '@aws-sdk/client-kinesis-analytics-v2',
    description: 'Build and run Apache Flink applications to process streaming data in real time.',
  },
  {
    id: 'mwaa', label: 'MWAA', sub: 'Managed Airflow', group: 'Messaging',
    emoji: '🌬️', tier: 'ultimate', proOnly: true, page: null, healthKey: 'mwaa',
    sdkPackage: '@aws-sdk/client-mwaa',
    description: 'Managed Apache Airflow for orchestrating complex data processing pipelines.',
  },
  {
    id: 'iot', label: 'IoT Core', sub: 'Internet of Things', group: 'Messaging',
    emoji: '📡', tier: 'base', proOnly: true, page: null, healthKey: 'iot',
    sdkPackage: '@aws-sdk/client-iot',
    description: 'Connect billions of IoT devices and route trillions of messages to AWS services without managing infrastructure.',
  },
  {
    id: 'pinpoint', label: 'Pinpoint', sub: 'Customer Engagement', group: 'Messaging',
    emoji: '📍', tier: 'hobby', proOnly: false, page: null, healthKey: 'pinpoint',
    sdkPackage: '@aws-sdk/client-pinpoint',
    description: 'Multi-channel marketing communications platform for email, SMS, push notifications, and voice.',
  },
  {
    id: 'swf', label: 'SWF', sub: 'Simple Workflow Service', group: 'Messaging',
    emoji: '🔄', tier: 'hobby', proOnly: false, page: null, healthKey: 'swf',
    sdkPackage: '@aws-sdk/client-swf',
    description: 'Build, run, and scale background jobs with parallel or sequential steps.',
  },

  // ── Networking ────────────────────────────────────────────────────────────────
  {
    id: 'apigateway', label: 'API Gateway', sub: 'REST / HTTP APIs', group: 'Networking',
    emoji: '🔌', tier: 'hobby', proOnly: false, page: 'APIGatewayPage', healthKey: 'apigateway',
    sdkPackage: '@aws-sdk/client-api-gateway',
    description: 'Create, publish, maintain, monitor, and secure REST, HTTP, and WebSocket APIs at any scale.',
  },
  {
    id: 'route53', label: 'Route 53', sub: 'DNS Service', group: 'Networking',
    emoji: '🌐', tier: 'hobby', proOnly: false, page: 'Route53Page', healthKey: 'route53',
    sdkPackage: '@aws-sdk/client-route-53',
    description: 'Scalable DNS web service. Route end users to internet applications with low latency.',
  },
  {
    id: 'route53resolver', label: 'Route 53 Resolver', sub: 'DNS Resolver', group: 'Networking',
    emoji: '🔍', tier: 'base', proOnly: true, page: null, healthKey: 'route53resolver',
    sdkPackage: '@aws-sdk/client-route-53-resolver',
    description: 'Resolve DNS queries between your VPC and on-premises or other cloud networks.',
  },
  {
    id: 'cloudfront', label: 'CloudFront', sub: 'CDN', group: 'Networking',
    emoji: '🌍', tier: 'base', proOnly: true, page: null, healthKey: 'cloudfront',
    sdkPackage: '@aws-sdk/client-cloudfront',
    description: 'Fast content delivery network (CDN). Deliver data, videos, and APIs globally with low latency.',
  },
  {
    id: 'acm', label: 'ACM', sub: 'Certificate Manager', group: 'Networking',
    emoji: '🔒', tier: 'hobby', proOnly: false, page: 'ACMPage', healthKey: 'acm',
    sdkPackage: '@aws-sdk/client-acm',
    description: 'Provision, manage, and deploy public and private SSL/TLS certificates.',
  },
  {
    id: 'acm-pca', label: 'ACM Private CA', sub: 'Private Certificate Authority', group: 'Networking',
    emoji: '🏛️', tier: 'base', proOnly: true, page: null, healthKey: 'acm-pca',
    sdkPackage: '@aws-sdk/client-acm-pca',
    description: 'Create and manage a private certificate authority (CA) to issue private certificates.',
  },
  {
    id: 'elb', label: 'ELB', sub: 'Load Balancing', group: 'Networking',
    emoji: '⚖️', tier: 'base', proOnly: true, page: null, healthKey: 'elbv2',
    sdkPackage: '@aws-sdk/client-elastic-load-balancing-v2',
    description: 'Distribute incoming application traffic across multiple targets for high availability.',
  },
  {
    id: 'appsync', label: 'AppSync', sub: 'GraphQL APIs', group: 'Networking',
    emoji: '🕸️', tier: 'base', proOnly: true, page: null, healthKey: 'appsync',
    sdkPackage: '@aws-sdk/client-appsync',
    description: 'Managed GraphQL APIs that securely connect apps to data and events with real-time and offline capabilities.',
  },
  {
    id: 'waf', label: 'WAF', sub: 'Web App Firewall', group: 'Networking',
    emoji: '🛡️', tier: 'base', proOnly: true, page: null, healthKey: 'wafv2',
    sdkPackage: '@aws-sdk/client-wafv2',
    description: 'Web application firewall protecting against common exploits, bots, and custom rules.',
  },
  {
    id: 'shield', label: 'Shield', sub: 'DDoS Protection', group: 'Networking',
    emoji: '🪖', tier: 'hobby', proOnly: false, page: null, healthKey: 'shield',
    sdkPackage: '@aws-sdk/client-shield',
    description: 'Managed DDoS protection that safeguards applications running on AWS.',
  },
  {
    id: 'transfer', label: 'Transfer', sub: 'SFTP / FTP', group: 'Networking',
    emoji: '📁', tier: 'base', proOnly: true, page: null, healthKey: 'transfer',
    sdkPackage: '@aws-sdk/client-transfer',
    description: 'Fully managed SFTP, FTPS, and FTP service for file transfers directly into and out of S3.',
  },
  {
    id: 'servicediscovery', label: 'Service Discovery', sub: 'Cloud Map', group: 'Networking',
    emoji: '🗺️', tier: 'hobby', proOnly: false, page: null, healthKey: 'servicediscovery',
    sdkPackage: '@aws-sdk/client-servicediscovery',
    description: 'Cloud map for service discovery. Register and discover resources in your cloud applications.',
  },
  {
    id: 'mediaconvert', label: 'MediaConvert', sub: 'Video Transcoding', group: 'Networking',
    emoji: '🎬', tier: 'base', proOnly: true, page: null, healthKey: 'mediaconvert',
    sdkPackage: '@aws-sdk/client-mediaconvert',
    description: 'File-based video transcoding service for broadcast-grade video processing at scale.',
  },

  // ── Security & Identity ───────────────────────────────────────────────────────
  {
    id: 'iam', label: 'IAM', sub: 'Access Management', group: 'Security',
    emoji: '🔑', tier: 'hobby', proOnly: false, page: 'IAMPage', healthKey: 'iam',
    sdkPackage: '@aws-sdk/client-iam',
    description: 'Manage access to AWS services and resources securely with users, groups, roles, and policies.',
  },
  {
    id: 'cognito', label: 'Cognito', sub: 'User Authentication', group: 'Security',
    emoji: '👥', tier: 'base', proOnly: true, page: 'CognitoPage', healthKey: 'cognito-idp',
    sdkPackage: '@aws-sdk/client-cognito-identity-provider',
    description: 'Add user sign-up, sign-in, and access control. Scale to millions of users and supports social and enterprise identity providers.',
  },
  {
    id: 'secrets', label: 'Secrets Manager', sub: 'Secrets & Rotation', group: 'Security',
    emoji: '🔐', tier: 'hobby', proOnly: false, page: 'SecretsPage', healthKey: 'secretsmanager',
    sdkPackage: '@aws-sdk/client-secrets-manager',
    description: 'Rotate, manage, and retrieve database credentials, API keys, and other secrets throughout their lifecycle.',
  },
  {
    id: 'kms', label: 'KMS', sub: 'Key Management', group: 'Security',
    emoji: '🗝️', tier: 'hobby', proOnly: false, page: 'KMSPage', healthKey: 'kms',
    sdkPackage: '@aws-sdk/client-kms',
    description: 'Create and control encryption keys used to encrypt your data across AWS services.',
  },
  {
    id: 'sts', label: 'STS', sub: 'Security Tokens', group: 'Security',
    emoji: '🎟️', tier: 'hobby', proOnly: false, page: 'STSPage', healthKey: 'sts',
    sdkPackage: '@aws-sdk/client-sts',
    description: 'Request temporary, limited-privilege credentials for IAM users or federated users.',
  },
  {
    id: 'organizations', label: 'Organizations', sub: 'Account Management', group: 'Security',
    emoji: '🏢', tier: 'hobby', proOnly: false, page: null, healthKey: 'organizations',
    sdkPackage: '@aws-sdk/client-organizations',
    description: 'Policy-based management for multiple AWS accounts. Centralize billing and apply governance policies.',
  },
  {
    id: 'account', label: 'Account', sub: 'Account Management API', group: 'Security',
    emoji: '👤', tier: 'hobby', proOnly: false, page: null, healthKey: 'account',
    sdkPackage: '@aws-sdk/client-account',
    description: 'Manage AWS account settings including contact information and region opt-in/opt-out status.',
  },
  {
    id: 'identitystore', label: 'Identity Store', sub: 'SSO Users & Groups', group: 'Security',
    emoji: '🗂️', tier: 'base', proOnly: true, page: null, healthKey: 'identitystore',
    sdkPackage: '@aws-sdk/client-identitystore',
    description: 'Central directory for users and groups used by AWS IAM Identity Center (SSO).',
  },
  {
    id: 'sso-admin', label: 'SSO Admin', sub: 'IAM Identity Center', group: 'Security',
    emoji: '🔓', tier: 'base', proOnly: true, page: null, healthKey: 'sso',
    sdkPackage: '@aws-sdk/client-sso-admin',
    description: 'Centrally manage SSO access to multiple AWS accounts and applications.',
  },
  {
    id: 'verifiedpermissions', label: 'Verified Permissions', sub: 'Fine-grained AuthZ', group: 'Security',
    emoji: '✅', tier: 'base', proOnly: true, page: null, healthKey: 'verifiedpermissions',
    sdkPackage: '@aws-sdk/client-verifiedpermissions',
    description: 'Fine-grained authorization and permissions management for applications using Cedar policy language.',
  },
  {
    id: 'ram', label: 'RAM', sub: 'Resource Access Manager', group: 'Security',
    emoji: '🤝', tier: 'hobby', proOnly: false, page: null, healthKey: 'ram',
    sdkPackage: '@aws-sdk/client-ram',
    description: 'Share AWS resources across AWS accounts, within your organization, or with specific accounts.',
  },

  // ── Management & Governance ───────────────────────────────────────────────────
  {
    id: 'cloudwatch', label: 'CloudWatch', sub: 'Monitoring & Logs', group: 'Management',
    emoji: '📈', tier: 'hobby', proOnly: false, page: 'CloudWatchPage', healthKey: 'logs',
    sdkPackage: '@aws-sdk/client-cloudwatch-logs',
    description: 'Monitor AWS resources and applications. Collect logs, set alarms, and visualize operational data.',
  },
  {
    id: 'cloudformation', label: 'CloudFormation', sub: 'Infrastructure as Code', group: 'Management',
    emoji: '☁️', tier: 'hobby', proOnly: false, page: 'CloudFormationPage', healthKey: 'cloudformation',
    sdkPackage: '@aws-sdk/client-cloudformation',
    description: 'Model, provision, and manage AWS resources with declarative YAML or JSON templates.',
  },
  {
    id: 'ssm', label: 'Parameter Store', sub: 'SSM / Config', group: 'Management',
    emoji: '🎛️', tier: 'hobby', proOnly: false, page: 'SSMPage', healthKey: 'ssm',
    sdkPackage: '@aws-sdk/client-ssm',
    description: 'Hierarchical storage for configuration data and secrets management with versioning.',
  },
  {
    id: 'stepfunctions', label: 'Step Functions', sub: 'Workflows', group: 'Management',
    emoji: '🔄', tier: 'hobby', proOnly: false, page: 'StepFunctionsPage', healthKey: 'stepfunctions',
    sdkPackage: '@aws-sdk/client-sfn',
    description: 'Coordinate distributed components into visual workflows using state machines.',
  },
  {
    id: 'appconfig', label: 'AppConfig', sub: 'Feature Flags', group: 'Management',
    emoji: '🚩', tier: 'base', proOnly: true, page: null, healthKey: 'appconfig',
    sdkPackage: '@aws-sdk/client-appconfig',
    description: 'Deploy application configurations quickly and safely. Use feature flags, operational toggles, and runtime settings.',
  },
  {
    id: 'cloudtrail', label: 'CloudTrail', sub: 'API Audit Logging', group: 'Management',
    emoji: '🗺️', tier: 'base', proOnly: true, page: null, healthKey: 'cloudtrail',
    sdkPackage: '@aws-sdk/client-cloudtrail',
    description: 'Track user activity and API usage. Record and retain account activity related to AWS API calls.',
  },
  {
    id: 'config', label: 'Config', sub: 'Resource Auditing', group: 'Management',
    emoji: '📋', tier: 'hobby', proOnly: false, page: null, healthKey: 'config',
    sdkPackage: '@aws-sdk/client-config-service',
    description: 'Assess, audit, and evaluate configurations of your AWS resources for compliance and governance.',
  },
  {
    id: 'cloudcontrol', label: 'Cloud Control API', sub: 'Unified Resource API', group: 'Management',
    emoji: '🎮', tier: 'base', proOnly: true, page: null, healthKey: 'cloudcontrol',
    sdkPackage: '@aws-sdk/client-cloudcontrol',
    description: 'Manage AWS and third-party cloud resources using a consistent set of API operations.',
  },
  {
    id: 'codecommit', label: 'CodeCommit', sub: 'Git Repositories', group: 'Management',
    emoji: '📝', tier: 'base', proOnly: true, page: null, healthKey: 'codecommit',
    sdkPackage: '@aws-sdk/client-codecommit',
    description: 'Fully managed source control service hosting secure private Git repositories.',
  },
  {
    id: 'codebuild', label: 'CodeBuild', sub: 'Build Service', group: 'Management',
    emoji: '🔨', tier: 'base', proOnly: true, page: null, healthKey: 'codebuild',
    sdkPackage: '@aws-sdk/client-codebuild',
    description: 'Fully managed build service. Compile source code, run tests, and produce deployable software packages.',
  },
  {
    id: 'codepipeline', label: 'CodePipeline', sub: 'CI/CD', group: 'Management',
    emoji: '🔁', tier: 'base', proOnly: true, page: null, healthKey: 'codepipeline',
    sdkPackage: '@aws-sdk/client-codepipeline',
    description: 'Fully managed continuous delivery service for fast and reliable application updates.',
  },
  {
    id: 'codedeploy', label: 'CodeDeploy', sub: 'Deployment Automation', group: 'Management',
    emoji: '🚀', tier: 'base', proOnly: true, page: null, healthKey: 'codedeploy',
    sdkPackage: '@aws-sdk/client-codedeploy',
    description: 'Automate code deployments to EC2, Lambda, and on-premises servers.',
  },
  {
    id: 'codeartifact', label: 'CodeArtifact', sub: 'Artifact Repository', group: 'Management',
    emoji: '🗃️', tier: 'base', proOnly: true, page: null, healthKey: 'codeartifact',
    sdkPackage: '@aws-sdk/client-codeartifact',
    description: 'Fully managed artifact repository for software packages. Supports npm, Maven, PyPI, and more.',
  },
  {
    id: 'codeconnections', label: 'CodeConnections', sub: 'Source Connections', group: 'Management',
    emoji: '🔗', tier: 'base', proOnly: true, page: null, healthKey: 'codeconnections',
    sdkPackage: '@aws-sdk/client-codeconnections',
    description: 'Connect and access third-party code repositories like GitHub, GitLab, and Bitbucket.',
  },
  {
    id: 'xray', label: 'X-Ray', sub: 'Distributed Tracing', group: 'Management',
    emoji: '🔭', tier: 'hobby', proOnly: false, page: null, healthKey: 'xray',
    sdkPackage: '@aws-sdk/client-xray',
    description: 'Trace requests through your applications to analyze and debug distributed systems.',
  },
  {
    id: 'fis', label: 'FIS', sub: 'Fault Injection / Chaos', group: 'Management',
    emoji: '💥', tier: 'base', proOnly: true, page: null, healthKey: 'fis',
    sdkPackage: '@aws-sdk/client-fis',
    description: 'AWS Fault Injection Service. Run controlled experiments to improve resilience and performance.',
  },
  {
    id: 'resource-groups', label: 'Resource Groups', sub: 'Resource Organization', group: 'Management',
    emoji: '📁', tier: 'hobby', proOnly: false, page: null, healthKey: 'resource-groups',
    sdkPackage: '@aws-sdk/client-resource-groups',
    description: 'Organize and manage AWS resources by application, environment, or project with tag-based grouping.',
  },
  {
    id: 'resource-groups-tagging', label: 'Resource Tagging API', sub: 'Tag Management', group: 'Management',
    emoji: '🏷️', tier: 'base', proOnly: true, page: null, healthKey: 'tagging',
    sdkPackage: '@aws-sdk/client-resource-groups-tagging-api',
    description: 'Manage tags across multiple AWS services and resources in bulk for cost allocation and governance.',
  },
  {
    id: 'support', label: 'Support', sub: 'AWS Support API', group: 'Management',
    emoji: '🎧', tier: 'hobby', proOnly: false, page: null, healthKey: 'support',
    sdkPackage: '@aws-sdk/client-support',
    description: 'Programmatically create, manage, and close AWS support cases.',
  },
  {
    id: 'ce', label: 'Cost Explorer', sub: 'Cost & Usage', group: 'Management',
    emoji: '💰', tier: 'hobby', proOnly: false, page: null, healthKey: 'ce',
    sdkPackage: '@aws-sdk/client-cost-explorer',
    description: 'Visualize, understand, and manage your AWS costs and usage over time.',
  },
  {
    id: 'amplify', label: 'Amplify', sub: 'Full-Stack Apps', group: 'Management',
    emoji: '⚡', tier: 'base', proOnly: true, page: null, healthKey: 'amplify',
    sdkPackage: '@aws-sdk/client-amplify',
    description: 'Build full-stack web and mobile applications with CI/CD, hosting, authentication, and APIs.',
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  {
    id: 'athena', label: 'Athena', sub: 'SQL on S3', group: 'Analytics',
    emoji: '🔍', tier: 'base', proOnly: true, page: null, healthKey: 'athena',
    sdkPackage: '@aws-sdk/client-athena',
    description: 'Interactive query service to analyze data in S3 using standard SQL. Pay only per query.',
  },
  {
    id: 'glue', label: 'Glue', sub: 'ETL & Data Catalog', group: 'Analytics',
    emoji: '🧩', tier: 'base', proOnly: true, page: null, healthKey: 'glue',
    sdkPackage: '@aws-sdk/client-glue',
    description: 'Serverless data integration for discovering, preparing, and combining data for analytics.',
  },
  {
    id: 'lakeformation', label: 'Lake Formation', sub: 'Data Lake', group: 'Analytics',
    emoji: '🏞️', tier: 'base', proOnly: true, page: null, healthKey: 'lakeformation',
    sdkPackage: '@aws-sdk/client-lakeformation',
    description: 'Set up a secure data lake in days. Collect, catalog, and share data with fine-grained access control.',
  },
  {
    id: 'opensearch', label: 'OpenSearch', sub: 'Search & Analytics', group: 'Analytics',
    emoji: '🔎', tier: 'base', proOnly: true, page: null, healthKey: 'opensearch',
    sdkPackage: '@aws-sdk/client-opensearch',
    description: 'Managed OpenSearch (Elasticsearch-compatible) for log analytics, real-time monitoring, and search.',
  },
  {
    id: 'timestream', label: 'Timestream', sub: 'Time Series Database', group: 'Analytics',
    emoji: '⏱️', tier: 'base', proOnly: true, page: null, healthKey: 'timestream',
    sdkPackage: '@aws-sdk/client-timestream-write',
    description: 'Serverless time series database for IoT and operational applications at scale.',
  },
  {
    id: 'qldb', label: 'QLDB', sub: 'Ledger Database', group: 'Analytics',
    emoji: '📒', tier: 'base', proOnly: true, page: null, healthKey: 'qldb',
    sdkPackage: '@aws-sdk/client-qldb',
    description: 'Fully managed ledger database with immutable, cryptographically verifiable transaction history.',
  },
  {
    id: 'managedblockchain', label: 'Managed Blockchain', sub: 'Blockchain Networks', group: 'Analytics',
    emoji: '⛓️', tier: 'base', proOnly: true, page: null, healthKey: 'managedblockchain',
    sdkPackage: '@aws-sdk/client-managedblockchain',
    description: 'Create and manage scalable blockchain networks using Hyperledger Fabric and Ethereum.',
  },
  {
    id: 'textract', label: 'Textract', sub: 'Document OCR', group: 'Analytics',
    emoji: '📑', tier: 'base', proOnly: true, page: null, healthKey: 'textract',
    sdkPackage: '@aws-sdk/client-textract',
    description: 'Extract text, handwriting, and structured data from scanned documents using ML.',
  },
  {
    id: 'transcribe', label: 'Transcribe', sub: 'Speech to Text', group: 'Analytics',
    emoji: '🎙️', tier: 'base', proOnly: true, page: null, healthKey: 'transcribe',
    sdkPackage: '@aws-sdk/client-transcribe',
    description: 'Automatic speech recognition (ASR) to add speech-to-text capability to applications.',
  },
];

// Build a de-duplicated unique list (some services appear in multiple groups)
const seen = new Set();
const SERVICES = SERVICE_CATALOG.filter(s => {
  if (seen.has(s.id)) return false;
  seen.add(s.id);
  return true;
});

export default SERVICES;

export const GROUPS = ['Storage', 'Compute', 'Messaging', 'Networking', 'Security', 'Management', 'Analytics'];

export function getServiceById(id) {
  return SERVICES.find(s => s.id === id);
}

export function getServicesByGroup(group) {
  return SERVICES.filter(s => s.group === group);
}
