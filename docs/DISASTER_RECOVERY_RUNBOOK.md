# Disaster Recovery Runbook

This guide covers emergency restoration procedures for complete disaster recovery scenarios (e.g. host corruption, total data loss, database failure).

## Target RTO
- **Recovery Time Objective (RTO)**: Under **1 Hour**

---

## Step-by-Step System Reconstruction

### Step 1: Environment Setup
1. Clone repository to fresh server:
   ```bash
   git clone <repo-url> thoughts-whatever
   cd thoughts-whatever
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Configure Environment Variables in `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/thoughts_whatever"
   AUTH_SECRET="<your-auth-secret>"
   R2_ACCOUNT_ID="<r2-account-id>"
   R2_ACCESS_KEY_ID="<r2-key-id>"
   R2_SECRET_ACCESS_KEY="<r2-secret-key>"
   R2_BACKUP_BUCKET_NAME="thoughts-whatever-backups"
   ```

### Step 2: Database Migration
Initialize PostgreSQL schema:
```bash
npx prisma db push
```

### Step 3: Download & Restore Latest Backup
1. Retrieve latest backup folder from Cloudflare R2 bucket or local archive:
   ```bash
   # Place in /backups directory
   /backups/backup_YYYY-MM-DD_HH-mm-ss/
   ```
2. Execute CLI restoration script:
   ```bash
   npx tsx scripts/restore-backup.ts backup_YYYY-MM-DD_HH-mm-ss full
   ```

### Step 4: Verification
1. Verify database content:
   ```bash
   npm run db:check
   ```
2. Start application dev/prod server:
   ```bash
   npm run build && npm run start
   ```
3. Access `/admin/system` to verify System Health status.
