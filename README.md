# GPU Lending Platform

A scalable, multi-tenant GPU lending platform with comprehensive backend infrastructure.

## Features

- 🖥️ GPU inventory management (servers, individual GPUs, clusters)
- 👥 Multi-tenant architecture with organization support
- 🔐 JWT authentication with role-based access control
- 📊 Real-time GPU monitoring and metrics
- 💰 Flexible billing (on-demand, subscription, hybrid)
- 💳 Multiple payment methods (Stripe, crypto, manual invoicing)
- 📈 Usage metering and tracking
- 🔄 Rental lifecycle management
- 📝 Comprehensive REST API with Swagger docs
- 🛡️ Security hardening and compliance features

## Tech Stack

- **Backend**: Node.js + TypeScript + Express
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Payments**: Stripe + Crypto gateways
- **Monitoring**: NVIDIA DCGM integration
- **Documentation**: Swagger/OpenAPI

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## Development Loop

The platform includes an automated development loop with logging and continuous improvements:

```bash
npm run dev:loop
```

## API Documentation

Once running, visit `http://localhost:3000/api-docs` for interactive API documentation.

## License

MIT
