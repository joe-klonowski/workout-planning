This file contains instructions for agentic coding systems that are editing code in this repository or answering questions about the project.

## General instructions
- Remove tasks from future-work.md as you complete them.
- Always read the following files and load them into context before answering questions or writing code:
  - AGENTS.md
  - README.md
  - future-work.md
  - start.sh (how to run the full application)
  - If working with the backend:
    - backend/README.md
    - backend/models.py (database schema - critical for understanding data structure)
    - backend/config.py (backend configuration)
    - backend/requirements.txt (Python dependencies)
    - If modifying database schema:
      - backend/alembic/README.md
  - If working with the frontend:
    - app/README.md
    - app/package.json (frontend dependencies and scripts)

## Development process
- When you write new code, always write new tests that go with it. Then run the new tests to make sure they pass.
- Aim for at least 90% test coverage.
- When fixing a bug, always update or add tests to reproduce the bug and verify that those tests fail before making code changes to fix the bug. Then rerun the tests to verify that the bug is fixed.
- After editing code:
  - Check whether local app's frontend and backend are running properly.
  - If not, launch frontend and/or backend as needed so that it's easy for me, the human developer, to manually QA the changes by looking at and clicking around the UI.

## Markdown files
- Avoid numbering section headers in Markdown, because it makes it more difficult to add or remove sections (you have to change all the numbers of the other sections).
