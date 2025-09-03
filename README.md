# /home/ubuntu/impaktrweb/README.md

# 🌍 Impaktr - Global Standard for Verified Social Impact

The first comprehensive platform to measure, verify, and benchmark social impact across volunteering, donations, CSR activities, and research participation.

## ✨ Features

- **🏆 Verified Impact Scoring**: GPS check-ins, peer verification, and organizer approval
- **🎖️ SDG Achievement Badges**: 68 unique badges across 17 UN Sustainable Development Goals
- **📊 Global Leaderboards**: Country, organizational, and SDG-specific rankings
- **🏢 Corporate ESG Dashboards**: Comprehensive CSR reporting and employee engagement analytics
- **🌐 Opportunity Marketplace**: Discover volunteering, research, scholarship, and donation opportunities
- **📜 Instant Certificates**: Shareable digital certificates for LinkedIn and resumes

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- PostgreSQL 14 or later
- Redis 6.0 or later
- Auth0 account (for authentication)
- AWS account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/impaktr.git
   cd impaktr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - Database connection string
   - Auth0 credentials
   - AWS credentials
   - Redis URL
   - Email service credentials

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed the database (optional)
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
impaktrweb/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── events/           # Events pages
│   │   ├── profile/          # Profile pages
│   │   └── globals.css       # Global styles
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── dashboard/        # Dashboard-specific components
│   │   ├── layout/           # Layout components
│   │   └── providers/        # Context providers
│   ├── lib/                  # Utility libraries
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── constants/            # Application constants
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── docs/                     # Documentation
└── README.md
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **React Query** - Data fetching and caching
- **Framer Motion** - Animation library
- **Zustand** - State management

### Backend
- **Node.js** - JavaScript runtime
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **Auth0** - Authentication and authorization
- **Bull Queue** - Background job processing

### Infrastructure
- **AWS S3** - File storage
- **AWS SES** - Email service
- **Socket.io** - Real-time communication
- **Docker** - Containerization
- **Vercel/AWS** - Deployment platform

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/impaktr"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth0
AUTH0_SECRET="your-auth0-secret"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
AUTH0_CLIENT_ID="your-client-id"
AUTH0_CLIENT_SECRET="your-client-secret"

# AWS
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="impaktr-uploads"

# Email
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASSWORD="your-smtp-password"
```

### Auth0 Setup

1. Create an Auth0 application
2. Set up callback URLs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://yourdomain.com/api/auth/callback` (production)
3. Configure logout URLs:
   - `http://localhost:3000` (development)
   - `https://yourdomain.com` (production)

### Database Setup

1. **Install PostgreSQL**
2. **Create database**
   ```sql
   CREATE DATABASE impaktr;
   ```
3. **Run migrations**
   ```bash
   npm run db:migrate
   ```

## 📊 Impaktr Score™ Formula

### Individual Score (0-1000)
```
Score = (H × I × S × Q × V) × L

Where:
H = Hours logged (log-scaled)
I = Intensity (0.8-1.2)
S = Skill multiplier (1.0-1.4)
Q = Quality rating (0.5-1.5)
V = Verification factor (0.8-1.1)
L = Location fairness multiplier (0.8-1.2)
```

### Organization Score (0-100)
```
Score = (E × H × Q × V × S × C) × G

Where:
E = Employee participation % (25%)
H = Hours per employee (15%)
Q = Quality rating (15%)
V = Verification % (10%)
S = Skills impact % (15%)
C = Cause diversity (10%)
G = Global fairness factor (0.8-1.2)
```

## 🎖️ Badge System

### SDG Badges (17 Goals × 4 Tiers = 68 Total)

Each UN Sustainable Development Goal has 4 progression tiers:

1. **Supporter** - Starting level (5+ hours, 1+ activities)
2. **Builder** - Building impact (25+ hours, 3+ activities)
3. **Champion** - Leading change (75+ hours, 8+ activities)
4. **Guardian** - Protecting progress (200+ hours, 20+ activities)

### Individual Ranks (10 Levels)
1. Helper → 2. Supporter → 3. Contributor → 4. Builder → 5. Advocate
6. Changemaker → 7. Mentor → 8. Leader → 9. Ambassador → 10. Global Citizen

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t impaktr-web .

# Run container
docker run -p 3000:3000 impaktr-web
```

### Environment-specific Deployment
- **Staging**: `npm run deploy:staging`
- **Production**: `npm run deploy:production`

## 📚 API Documentation

### Authentication
All API routes except public endpoints require authentication via Auth0.

### Core Endpoints

#### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/sync` - Sync user from Auth0

#### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

#### Participation
- `POST /api/events/[id]/participate` - Join event
- `PUT /api/events/[id]/participate` - Update participation
- `DELETE /api/events/[id]/participate` - Cancel participation

#### Verification
- `POST /api/verifications` - Create verification
- `GET /api/verifications` - List verifications
- `PUT /api/verifications/[id]` - Update verification

#### Leaderboards
- `GET /api/leaderboards` - Get leaderboard data

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Core platform functionality
- ✅ User authentication and profiles
- ✅ Event creation and participation
- ✅ Verification system
- ✅ Basic scoring algorithm

### Phase 2 (Q2 2024)
- 🔄 Mobile app development
- 🔄 Advanced analytics dashboard
- 🔄 API for third-party integrations
- 🔄 Blockchain verification

### Phase 3 (Q3 2024)
- ⏳ Corporate partnerships
- ⏳ Global CSR Impact Index
- ⏳ AI-powered opportunity matching
- ⏳ Multi-language support

### Phase 4 (Q4 2024)
- ⏳ Scholarship marketplace
- ⏳ Research opportunities platform
- ⏳ Impact investment tracking
- ⏳ Global expansion

## 🆘 Support

- **Documentation**: [docs.impaktr.com](https://docs.impaktr.com)
- **Email**: support@impaktr.com
- **Discord**: [Join our community](https://discord.gg/impaktr)
- **GitHub Issues**: [Report bugs](https://github.com/impaktr/impaktr/issues)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- UN Sustainable Development Goals for inspiration
- Auth0 for authentication infrastructure
- Vercel for deployment platform
- Open source community for amazing tools

---

**Made with ❤️ for a better world** 🌍

[Website](https://impaktr.com) • [Documentation](https://docs.impaktr.com) • [Twitter](https://twitter.com/impaktrcom)