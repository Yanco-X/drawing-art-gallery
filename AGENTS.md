# Agentic Workflow Rules

This document establishes the basic rules and guidelines for AI agents working on this repository.

## 1. Plan Before Execution
- Always understand the full context of a request before starting implementation.
- Ask for clarification if requirements are ambiguous.
- Break down complex tasks into smaller, manageable steps.

## 2. Tech Stack Consistency
- Stick to the defined tech stack: **React + TypeScript** for the frontend, and **Python + Flask + MongoDB** for the backend.
- Avoid introducing unnecessary third-party libraries without explicit approval.

## 3. Step-by-Step Implementation
- Implement and verify one feature or component at a time.
- Do not make sweeping changes across the entire codebase at once unless absolutely necessary.

## 4. Code Quality & Modularity
- Write clean, readable, and well-documented code.
- Separate concerns appropriately (e.g., separate UI components from business logic).
- Use proper TypeScript types and interfaces to ensure type safety on the frontend.
- Adhere to PEP 8 standards for Python code.
- One function per task, if a task is too big, break it down into smaller tasks.
- No comments unless it is strictly necessary or the function is too complex.
- No need to explain what the code does, as the code itself should be self-explanatory.
- No need to explain the logic or the reason behind a decision, unless it is strictly necessary.
- NO EMOJIS!!!

## 5. Incremental Progress & Testing
- Whenever possible, validate that the local changes work before moving on to the next step.
- Ensure that both the frontend and backend can run without errors after each significant update.

## 6. Clear Communication
- Keep the user updated on what steps are being taken and why.
- Provide clear summaries of the changes made during a session.

## 7. Context & References
- Take into account md files for context, these files are meant to be read.
- When mentioned in the user input prompt, take into account the md files that describe the context of the project or task.
- @context/project-overview.md contains full in depth description of the project, its goals, and context.
- @context/DESIGN.md contains the design guidelines and rules.
- @context/PROJECT.md contains the project pillars, goals.
- @context/STRUCTURE.md contains the project structure.
- @README.md contains the overall project context and roadmap.
- @context/ai-interactions.md contains the AI interaction guidelines.
- @context/coding-preferences.md contains in depth coding preferences and rules.
- @context/current-feature.md contains the current feature being worked on. This file is meant to be updated as the feature is being worked on. Clean this file before starting a new feature.

# Commands

## Frontend
- `npm run dev` - Start the development server.
- `npm run build` - Build the project for production.

## Backend
- `python run.py` - Start the development server.


