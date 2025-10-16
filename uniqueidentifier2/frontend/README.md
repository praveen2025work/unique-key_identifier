# Unique Key Identifier - Frontend

This is a Next.js 14 application converted from Vite/React.

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Different Environments

The application supports building for multiple environments:

```bash
# Development build
npm run build:dev

# UAT build
npm run build:uat

# Production build
npm run build:prod

# DR build
npm run build:dr

# Build all environments at once
npm run build:all
```

Each environment build:
1. Copies the respective `.env.<env>` file to `.env.local`
2. Builds the Next.js application
3. Exports the static output to `out/`
4. Copies the output to `dist/<env>/`

### Environment Files

Create the following environment files in the root directory:

- `.env.dev` - Development environment
- `.env.uat` - UAT environment
- `.env.prod` - Production environment
- `.env.dr` - Disaster Recovery environment

Each file should contain:

```bash
NEXT_PUBLIC_API_ENDPOINT=<your-api-endpoint>
NEXT_PUBLIC_ENV=<environment-name>
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── src/
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── types/             # TypeScript types
│   └── index.css          # Global styles
├── public/                # Static assets
├── next.config.mjs        # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Migration from Vite to Next.js

This application was migrated from Vite to Next.js 14 with the following changes:

1. **Build System**: Replaced Vite with Next.js
2. **Routing**: Using Next.js App Router instead of React Router
3. **Configuration**: Replaced vite.config.ts with next.config.mjs
4. **Entry Point**: Replaced index.html + main.tsx with app/layout.tsx + app/page.tsx
5. **Client Components**: Added 'use client' directive to all components using React hooks
6. **Static Export**: Configured for static export to support multi-environment builds

## Static Export

The application is configured for static export (`output: 'export'` in next.config.mjs), which means:

- All pages are pre-rendered at build time
- No server-side rendering or API routes
- Suitable for deployment to static hosting (IIS, S3, etc.)

## Deployment

The built application can be deployed from the `dist/<env>/` directory for the respective environment.

For IIS deployment, use the included `deploy-to-iis.ps1` script.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

