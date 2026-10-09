Read only: do not change, build, install or commit anything. Write a file
Skillgap/aos-structure.md (outside all repos) and show it to me when done.
Never show the values of secrets, tokens, passwords, hosts or account IDs; names only.

Repos: Skillgap/fobotower-main (upstream reference), aos-backend, aos-frontend.

A. aos-frontend
1. Folder tree, 3 levels deep (skip node_modules, dist, build, .next, .git).
2. Framework and bundler with versions (Next.js / Vite / CRA), React version.
3. JSX or TSX? Is there a tsconfig.json? Count .jsx, .tsx, .js, .ts files.
4. Styling: Tailwind (version and config file), CSS modules, other. Icon library and version.
5. Where routes and the left menu are defined (file paths).
6. Full package.json.
7. How it calls the backend: base URL setting name, auth header or SSO method (names only).
8. Where the Agent One Finance (AOF) screens are now. Output of: git log --stat -8
9. Which files are copies or conversions of fobotower-main/apps/web (list each with its upstream file).

B. aos-backend
1. Folder tree, 3 levels deep (skip .venv, __pycache__, .git).
2. Python version; dependency file (pyproject / requirements / lock) and its full content.
3. Paths of: the agent_one_finance package, config/agent-one-finance, aof_migrations, aof_alembic.ini.
4. How the app starts (uvicorn command, entrypoint, port).
5. Other services or apps in this repo, and whether they share code with AOF.
6. Settings: list of environment variable names read by AOF (no values).
7. Output of: git log --stat -8
8. Files that differ from fobotower-main/apps/backend (list only, grouped by folder).

C. Build and deployment (both repos)
1. Dockerfiles: path, base image, what they install, start command.
2. Pipeline file (.gitlab-ci.yml or other): stage names, image names and tags.
3. Any AWS files (ECS task definitions, Helm, CDK, Terraform, CloudFormation):
   service names, ports, health check paths, database settings names.
4. How the frontend is served (nginx, S3/CloudFront, Node server) and how it reaches the backend.

End with a short summary: framework, language, styling, where AOF lives in each repo,
and anything that looks converted by hand (TSX to JSX, restyled, renamed).
