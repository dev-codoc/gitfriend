# Gitfriend

Gitfriend is a Next.js app that lets users ask natural-language questions about any public GitHub repository. It indexes the repo code, builds a searchable knowledge layer, and answers questions with grounded responses.

## Project structure

- `src/app` - Next.js App Router pages, layout, and API routes
- `src/components` - UI components used throughout the app
- `src/lib/prisma.ts` - Prisma database client setup
- `backend` - Python backend services and requirements
- `prisma/schema.prisma` - Prisma schema for database models
- `public` - Static assets, including the site favicon and logo

## Features

- GitHub repo URL ingestion
- Repository indexing and code search
- AI-powered chat backed by actual repository files
- User authentication and session management
- Persistent history by repository

## Getting started

Install dependencies for the frontend:

```bash
npm install
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Run the development server:

```bash
cd ..
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Favicon and branding

The site icon is stored in `public/icon-logo.png` and is used by Next.js for the browser tab icon. The app also renders the logo and brand name on the homepage in the center of the page.

## Scripts

- `npm run dev` - start the frontend in development mode
- `npm run build` - build the Next.js app for production
- `npm start` - run the built Next.js app
- `npm run lint` - run ESLint

## Notes

- This project uses Next.js 16, React 19, and Tailwind CSS for styling.
- The App Router is used for page routing and metadata handling.
- Update the `public/icon-logo.png` asset to change the app branding.
