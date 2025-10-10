# 🔄 Transition from EC2 to Vercel + Neon

This guide will help you and Jimmy safely decommission your EC2 instance now that you've successfully deployed to Vercel with Neon database.

## ✅ Current Status

- ✅ Deployed to Vercel (production hosting)
- ✅ Database migrated to Neon (managed PostgreSQL)
- ✅ AWS S3 for file storage (still needed)
- ✅ AWS SES for email service (still needed)
- 🔄 EC2 instance (to be decommissioned)

## 📋 Pre-Shutdown Checklist

Before shutting down your EC2 instance, verify the following:

### 1. Vercel Deployment is Fully Functional

- [ ] Visit your production URL and test all features
- [ ] Test user authentication (Auth0)
- [ ] Test database operations (Neon connection)
- [ ] Test file uploads (S3 integration)
- [ ] Test email notifications (SES integration)
- [ ] Check real-time features (Socket.io if applicable)

### 2. Environment Variables in Vercel

Ensure all these variables are set in Vercel Dashboard → Settings → Environment Variables:

```env
# Database (Neon)
DATABASE_URL="postgresql://..." # Your Neon connection string

# Redis (if using Upstash or another managed Redis)
REDIS_URL="redis://..."

# Auth0
AUTH0_SECRET="..."
AUTH0_BASE_URL="https://your-domain.vercel.app"
AUTH0_ISSUER_BASE_URL="..."
AUTH0_CLIENT_ID="..."
AUTH0_CLIENT_SECRET="..."

# AWS (S3 and SES)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="..."

# Email (SES)
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="..."
SMTP_PASSWORD="..."

# Next Auth
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="..."
```

### 3. Backup Important Data from EC2

Before shutting down, backup:

```bash
# If you're still on EC2, run these commands:

# Backup any custom configuration files
scp -r ubuntu@your-ec2-ip:~/impaktrweb/.env.local ~/backups/

# Backup any local data (if any)
scp -r ubuntu@your-ec2-ip:~/impaktrweb/uploads ~/backups/

# Backup any logs or important files
scp -r ubuntu@your-ec2-ip:~/impaktrweb/logs ~/backups/
```

## 🛑 Steps to Decommission EC2

### Step 1: Stop the Instance (Test Period)

1. Log into AWS Console → EC2 Dashboard
2. Select your EC2 instance
3. Click **Instance State** → **Stop instance**
4. Wait for the instance to fully stop

**Test for 3-7 days** to ensure:
- Vercel app continues working perfectly
- No services depend on the EC2 instance
- All team members can develop locally

### Step 2: Terminate the Instance (After Testing)

Once you're confident everything works:

1. AWS Console → EC2 Dashboard
2. Select your stopped instance
3. Click **Instance State** → **Terminate instance**
4. Confirm termination

⚠️ **Warning**: Termination is permanent and cannot be undone!

### Step 3: Clean Up AWS Resources

After terminating the instance, clean up:

#### a) Elastic IP (if you had one)
- EC2 → Elastic IPs
- Select the IP → Actions → Release Elastic IP address
- **Important**: Unreleased Elastic IPs incur charges!

#### b) Security Groups
- EC2 → Security Groups
- Delete custom security groups created for your instance
- Keep the default security group

#### c) EBS Volumes
- EC2 → Volumes
- Delete any unattached volumes
- **Note**: Volumes not set to auto-delete will remain after instance termination

#### d) Snapshots (optional)
- EC2 → Snapshots
- Delete old snapshots if you don't need backups

#### e) Key Pairs (optional)
- EC2 → Key Pairs
- Delete the SSH key pair if no longer needed

### Step 4: Update DNS (if applicable)

If you had a custom domain pointing to EC2:
- Remove A records pointing to EC2 IP
- Ensure Vercel domain is properly configured
- Wait for DNS propagation (24-48 hours)

## 💻 Local Development Setup

Now that EC2 is gone, you and Jimmy should work locally:

### For Each Developer:

1. **Clone the repository** (if not already on local machine):
   ```bash
   git clone https://github.com/your-org/impaktrweb.git
   cd impaktrweb
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env.local`** file:
   ```bash
   cp .env.example .env.local
   ```

4. **Configure local environment variables**:
   ```env
   # Database - Use Neon connection string
   DATABASE_URL="postgresql://..."

   # Redis - Use Upstash or local Redis
   REDIS_URL="redis://localhost:6379"  # or your Upstash URL

   # Auth0 - Use development app
   AUTH0_SECRET="generate-a-long-random-string"
   AUTH0_BASE_URL="http://localhost:3000"
   AUTH0_ISSUER_BASE_URL="https://your-domain.auth0.com"
   AUTH0_CLIENT_ID="..."
   AUTH0_CLIENT_SECRET="..."

   # AWS (same as production)
   AWS_ACCESS_KEY_ID="..."
   AWS_SECRET_ACCESS_KEY="..."
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="..."

   # Email (same as production)
   SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
   SMTP_PORT="587"
   SMTP_USER="..."
   SMTP_PASSWORD="..."
   ```

5. **Set up the database**:
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to Neon database
   npm run db:push
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

7. **Open browser**:
   Navigate to http://localhost:3000

### Development Workflow

Each developer should:
1. Work on their own feature branches
2. Push changes to GitHub
3. Vercel will auto-deploy from main/production branch
4. Use pull requests for code review

### If You Need Multiple Users on One Machine

If you still need shared development on a machine:

```bash
# User 1 (Liangqi)
PORT=3000 npm run dev

# User 2 (Jimmy)
PORT=3001 npm run dev
```

Access at:
- Liangqi: http://localhost:3000
- Jimmy: http://localhost:3001

## 💰 Cost Savings

By moving from EC2 to Vercel + Neon:

### EC2 Costs (eliminated):
- Instance: ~$10-50/month (depending on instance type)
- EBS Storage: ~$5-10/month
- Elastic IP (if unused): $3.60/month
- Data transfer: varies

### New Costs:
- Vercel: Free tier or Pro ($20/month) - scales automatically
- Neon: Free tier (512MB database) or paid tier
- S3: Pay as you go (typically <$5/month for small apps)
- SES: $0.10 per 1,000 emails

**Estimated savings**: $20-70/month depending on usage

## 🔍 Monitoring After Transition

Monitor these for the first week:

1. **Vercel Dashboard**:
   - Check for deployment errors
   - Monitor function execution times
   - Watch for rate limit issues

2. **Neon Dashboard**:
   - Monitor database connection count
   - Check query performance
   - Watch storage usage

3. **Application Logs**:
   - Check Vercel logs for errors
   - Monitor Auth0 logs for auth issues
   - Check S3 for failed uploads

## 🆘 Rollback Plan (Emergency)

If something goes wrong:

### Option 1: Restart EC2 (if only stopped)
1. Go to EC2 Dashboard
2. Select instance → Start instance
3. Wait for it to boot
4. Update DNS if needed

### Option 2: Restore from Snapshot (if terminated)
1. EC2 → Snapshots
2. Select snapshot → Create Volume
3. Launch new instance with this volume
4. Reconfigure settings

**Note**: This is why we recommend stopping first, not terminating!

## 📝 Files to Delete from Repository

The following files are EC2-specific and can be deleted:

```bash
# Delete these files (already done in package.json update)
# - memory-monitor.sh
# - dev-safe.sh
# - restart-dev.sh
# - PORT-SETUP.md (if it's EC2-specific)

# You can also remove EC2-specific documentation from:
# - README.md (already updated)
# - Any deployment scripts referencing EC2
```

## ✅ Final Checklist

Before considering the transition complete:

- [ ] Vercel app working perfectly for 3-7 days
- [ ] All team members can develop locally
- [ ] EC2 instance stopped (not terminated yet)
- [ ] No errors in Vercel logs
- [ ] Database connections stable on Neon
- [ ] All AWS services (S3, SES) working
- [ ] No outstanding work on EC2 instance
- [ ] All important data backed up
- [ ] EC2 instance terminated
- [ ] Elastic IP released (if any)
- [ ] Security groups cleaned up
- [ ] EBS volumes deleted
- [ ] Cost monitoring set up in AWS

## 🎉 Success!

Congratulations! You've successfully transitioned from EC2 to a modern, scalable, and cost-effective infrastructure:

- ✅ **Vercel**: Auto-scaling, zero-config hosting
- ✅ **Neon**: Serverless PostgreSQL with auto-scaling
- ✅ **S3**: Reliable file storage
- ✅ **SES**: Professional email service

Your application is now:
- More reliable (managed services)
- More scalable (automatic scaling)
- Cheaper (pay only for what you use)
- Easier to maintain (no server management)

## 📞 Need Help?

If you encounter issues during the transition:
1. Check Vercel logs: https://vercel.com/dashboard
2. Check Neon logs: https://console.neon.tech/
3. Review this document's rollback plan
4. Check the troubleshooting section in README.md

---

**Date of Transition**: _________________
**Completed by**: Liangqi & Jimmy
**EC2 Instance ID**: _________________
**Status**: ☐ Stopped | ☐ Terminated | ☐ Cleaned Up

