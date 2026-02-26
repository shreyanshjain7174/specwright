# Setup Instructions for The Reasoning Engine

## ✅ What's Been Completed

1. **GitHub Repository**
   - Created at: https://github.com/shreyanshjain7174/reasoning-engine
   - Public repository with comprehensive README
   - Initial commit pushed successfully

2. **Next.js 14 Project**
   - App Router architecture
   - TypeScript configured
   - Tailwind CSS set up
   - shadcn/ui foundation configured

3. **Database Setup**
   - Drizzle ORM configured
   - PostgreSQL schema created with:
     - `specs` table (Executable Specifications)
     - `simulations` table (Pre-Code Virtual User testing)
   - Migration scripts added to package.json

4. **Project Structure**
   ```
   src/
     app/          # Next.js pages (homepage with project overview)
     components/   # Navigation component
     lib/          # Utility functions (cn helper)
     db/           # Drizzle schema + connection
   ```

5. **Basic UI**
   - Navigation header with links to Specs, Simulations, Docs
   - Homepage with project overview and feature cards
   - Responsive layout with container

## 🚀 Next Steps to Get Running

### 1. Install Dependencies (Already Done)
```bash
npm install
```

### 2. Set Up Database
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your PostgreSQL connection string
# DATABASE_URL="postgresql://user:password@host:5432/reasoning_engine"
```

**Recommended:** Use [Neon](https://neon.tech) for free serverless PostgreSQL:
1. Sign up at neon.tech
2. Create a new project
3. Copy the connection string to .env.local

### 3. Push Database Schema
```bash
npm run db:push
```

### 4. Run Development Server
```bash
npm run dev
```

Open http://localhost:3000

## 📦 Installed Packages

**Core:**
- next@^14.2.22
- react@^18.3.1
- react-dom@^18.3.1
- typescript@^5.7.2

**Database:**
- drizzle-orm
- drizzle-kit (dev)
- @neondatabase/serverless
- postgres

**UI:**
- tailwindcss
- clsx
- tailwind-merge
- @tailwindcss/postcss

**Types:**
- @types/node
- @types/react
- @types/react-dom

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

## 🗄️ Database Schema Overview

### Specs Table
```typescript
{
  id: UUID (primary key)
  title: TEXT
  status: TEXT (draft, active, shipped, deprecated)
  narrative: TEXT
  contextPointers: JSONB[]
  constraints: JSONB[]
  verificationTests: JSONB[]
  createdBy: TEXT
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### Simulations Table
```typescript
{
  id: UUID (primary key)
  specId: UUID (foreign key → specs)
  scenario: TEXT
  result: TEXT (success, failure, partial)
  findings: JSONB[]
  runAt: TIMESTAMP
  duration: INTEGER (milliseconds)
}
```

## 📝 Notes

1. **No Environment File Committed:** You'll need to create `.env.local` with your DATABASE_URL
2. **Migrations Folder:** The `src/db/migrations/` folder is gitignored
3. **shadcn/ui:** Components can be added with `npx shadcn@latest add <component>`
4. **Path Aliases:** `@/` is configured to point to `src/`

## 🐛 Potential Issues

- **Moderate npm vulnerabilities:** Run `npm audit fix` if needed (check for breaking changes)
- **Database connection:** Ensure your PostgreSQL instance is running and accessible
- **Port conflicts:** Default is 3000, change in package.json if needed

## 🔗 Links

- **GitHub Repo:** https://github.com/shreyanshjain7174/reasoning-engine
- **Full Documentation:** See CLAUDE.md for complete project context
- **Project README:** README.md for public-facing documentation

---

**Status:** ✅ Repository set up and ready for development
**Last Updated:** 2026-02-09
