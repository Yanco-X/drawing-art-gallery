# Project Structure

This project follows a modularized monolith architecture. The frontend and backend codebases are separated into their own respective directories within the root.

## Root Directory

```text
/
├── frontend/       # React + TypeScript frontend application
├── backend/        # Python + Flask + PostgreSQL backend API
├── README.md       # Project overview and roadmap
├── AGENTS.md       # Agentic workflow rules
└── PROJECT.md      # This file, outlining the project structure
```

## Frontend Structure (`/frontend`)

The frontend is a React + TypeScript application built with custom components rather than relying on a complex component library, ensuring a simple, clean design and interface. Major entities are grouped into their own dedicated folders.

```text
/frontend/src/
├── components/     # Reusable UI components (e.g., buttons, inputs, cards)
├── pages/          # Page-level components representing routes (e.g., Home, Gallery, Upload)
├── hooks/          # Custom React hooks containing reusable logic
├── contexts/       # React Context API files for global state management
├── services/       # API interaction logic and network requests to the backend
├── utils/          # Helper functions and utility scripts
├── assets/         # Static assets like images, icons, and global CSS
└── types/          # TypeScript interface and type definition files
```

### Component Guidelines
- We create our own UI components to keep the application lightweight.
- Components should be modular, isolated, and highly reusable.

## Backend Structure (`/backend`)

*(To be defined in the next steps)*
