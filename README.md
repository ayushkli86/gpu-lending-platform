# GPU Lending Platform

A scalable, multi-tenant GPU lending platform with comprehensive backend infrastructure and automated development loop.

## 🌟 Features

- 🖥️ **GPU Inventory Management** - Servers, individual GPUs, and clusters
- 👥 **Multi-tenant Architecture** - Organization support with isolation
- 🔐 **JWT Authentication** - Role-based access control (Admin, Org Owner, User)
- 📊 **Real-time Monitoring** - GPU metrics and health checks
- 💰 **Flexible Billing** - On-demand, subscription, and hybrid models
- 💳 **Multiple Payments** - Stripe, crypto, and manual invoicing
- 📈 **Usage Metering** - Event-driven tracking and aggregation
- 🔄 **Rental Management** - Complete lifecycle with extensions
- 📝 **REST API** - Comprehensive endpoints with Swagger docs
- 🛡️ **Security** - Audit logging, encryption, compliance features
- 🤖 **Automated Loop** - Continuous testing, logging, and improvements

## 🚀 Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Payments**: Stripe + Crypto gateways
- **Monitoring**: NVIDIA DCGM integration
- **Documentation**: Swagger/OpenAPI
- **DevOps**: Docker Compose

## 📦 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/ayushkli86/gpu-lending-platform.git
cd gpu-lending-platform

# Run automated setup
npm run setup

# Seed database with test data
npm run prisma:seed
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Automated development loop (builds, tests, commits every 15 min)
npm run automate
```

## 🔄 Automated Development Loop

The platform includes a sophisticated automation system that:

1. **Builds** the project and checks for errors
2. **Starts** the development server
3. **Runs** automated API tests
4. **Analyzes** logs for improvements
5. **Commits** changes with human-like messages
6. **Pushes** to GitHub every 3 loops

```bash
npm run automate
```

The loop runs every **15 minutes** with a countdown timer. Press `Ctrl+C` to stop gracefully.

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

### Test Credentials

After seeding:
- **Admin**: `admin@gpulending.com` / `admin123`
- **User**: `user@example.com` / `user123`

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production server |
| `npm run automate` | Start automated development loop |
| `npm run setup` | Initial setup (install, migrate, seed) |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with test data |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm test` | Run test suite |

## 📁 Project Structure

```
gpu-lending-platform/
├── src/
│   ├── config/          # Configuration (Swagger, etc.)
│   ├── middleware/      # Auth, error handling
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── utils/           # Utilities (logger, Prisma)
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Test data seeder
├── scripts/
│   ├── master-loop.js   # Main automation loop
│   ├── dev-loop.js      # Development loop
│   ├── setup.js         # Setup script
│   ├── test-api.js      # API tests
│   └── github-setup.js  # GitHub integration
├── logs/                # Application logs
└── docker-compose.yml   # Docker services
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### GPUs
- `GET /api/v1/gpus` - List all GPUs
- `GET /api/v1/gpus/available` - List available GPUs
- `POST /api/v1/gpus` - Create GPU (admin)
- `GET /api/v1/gpus/servers` - List GPU servers

### Rentals
- `POST /api/v1/rentals` - Create rental
- `GET /api/v1/rentals/my-rentals` - Get user's rentals
- `POST /api/v1/rentals/:id/end` - End rental
- `POST /api/v1/rentals/:id/extend` - Extend rental

### Subscriptions
- `GET /api/v1/subscriptions/plans` - List plans
- `POST /api/v1/subscriptions` - Subscribe to plan
- `GET /api/v1/subscriptions/my-subscriptions` - Get subscriptions

### Invoices
- `GET /api/v1/invoices/my-invoices` - Get user's invoices
- `POST /api/v1/invoices/:id/pay` - Pay invoice

### Admin
- `GET /api/v1/admin/stats` - Platform statistics
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/rentals` - List all rentals

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/gpu_lending"
REDIS_URL="redis://localhost:6379"
JWT_SECRET=your-secret-key
STRIPE_SECRET_KEY=sk_test_your_key
```

## 🐳 Docker Setup

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Stop services
docker-compose down
```

## 📊 Monitoring & Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `master-loop.log` - Automation loop logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure they pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Ayush Katuwal**
- Email: katuwalayush616@gmail.com
- GitHub: [@ayushkli86](https://github.com/ayushkli86)

## 🙏 Acknowledgments

Built with modern technologies and best practices for production-ready GPU infrastructure management.

---

⭐ Star this repo if you find it useful!
