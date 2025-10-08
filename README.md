# Topcoder Lookup API v5 (NestJS Migration)

This project is the revised Topcoder Lookup API, migrated from its original Express/DynamoDB/Elasticsearch stack to a modern, simplified, and more maintainable architecture using NestJS, TypeScript, Prisma, and PostgreSQL.

The new architecture eliminates the complexity of the dual-datastore system, simplifies local development, and provides a robust foundation for future development by retaining all original functionality.

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: pnpm

## Prerequisites

- Node.js (v20 or later recommended)
- pnpm
- Docker and Docker Compose

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lookups-api-v6
```

### 2. Install Dependencies

This project uses pnpm as the package manager. Ensure you have it installed, then run:

```bash
pnpm install
```

### 3. Set Up the Database

The PostgreSQL database is managed using Docker Compose for easy local setup.

```bash
docker compose up -d
```

This command will start a PostgreSQL container running on port 5432.

### 4. Configure Environment Variables

Create a `.env` file in the root of the project. You can copy the example structure below. The default values are configured to work with the local Docker setup.

```bash
# .env

# PostgreSQL Database URL for Prisma
# This is used by Prisma to connect to your local PostgreSQL instance.
DATABASE_URL="postgresql://user:password@localhost:5432/lookups?schema=public"

# ---------------------------------------------------
# JWT Authentication Secrets
# These are used by tc-core-library-js for validating JWTs.
# ---------------------------------------------------

# The secret key used to sign and verify JWTs.
AUTH_SECRET="mysecret"

# A JSON array string of valid token issuers.
VALID_ISSUERS='["https://topcoder-dev.auth0.com/","https://api.topcoder.com"]'


# ---------------------------------------------------
# M2M/Auth0 Configuration
# These values are required by tc-core-library-js for M2M authentication.
# ---------------------------------------------------

# The audience identifier for your Auth0 M2M application.
AUTH0_AUDIENCE="<auth0-audience>"

# The URL for obtaining an M2M token from Auth0.
AUTH0_URL="<auth0-url>"

# The Client ID of your Auth0 M2M application.
AUTH0_CLIENT_ID="<auth0-client-id>"

# The Client Secret of your Auth0 M2M application.
AUTH0_CLIENT_SECRET="<auth0-client-secret>"

# Optional: A proxy server URL for Auth0 requests.
AUTH0_PROXY_SERVER_URL=
```

### 5. Run Database Migrations and Seeding

Prisma manages the database schema and seed data.

1. **Apply Migrations**: This command will create the necessary tables in your PostgreSQL database based on the `prisma/schema.prisma` file.

   ```bash
   pnpm prisma migrate dev
   ```

2. **Generate Prisma Client**: After any change to `schema.prisma`, you should regenerate the Prisma Client. It's also good practice to run it after installing dependencies.

   ```bash
   pnpm prisma generate
   ```
   ```

3. **Seed the Database**: This command will populate the database with the initial lookup data from the `.json` files located in the `prisma/seed-data/` directory.

   ```bash
   pnpm prisma db seed
   ```

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading:

```bash
pnpm run start:dev
```

The application will be available at http://localhost:3000.

## API Documentation

Once the application is running, interactive API documentation (Swagger UI) is available at:

http://localhost:3000/api-docs

## Running Tests

This project includes a comprehensive suite of end-to-end (E2E) tests to ensure all functionality is working correctly. The tests run against the database and will clean up after themselves.

```bash
pnpm run test:e2e
```

## Migration Process Documentation

The migration from the legacy stack to the new NestJS/Prisma/PostgreSQL stack was achieved through the following process:

1. **Technology Stack Selection**: A modern stack was chosen to simplify the architecture and improve maintainability, eliminating the dual-datastore complexity of DynamoDB and Elasticsearch.
2. **Schema Definition**: The data models from the original application were consolidated into a single `prisma/schema.prisma` file, which serves as the source of truth for the database schema.
3. **Data Population**: A seed script (`prisma/seed.ts`) was created to parse the original data (provided as NDJSON files) and populate the new PostgreSQL database. This replaces the old `loadData.js` and `migrateData.js` scripts.
4. **API Implementation**: The original Express routes and controllers were re-implemented as NestJS modules, controllers, and services, ensuring all endpoints and functionalities were retained.
5. **Authentication & Authorization**: JWT validation and permission logic were re-created using NestJS Guards, preserving the original role- and scope-based access control.
6. **Validation**: A full suite of E2E tests was created to validate that the new API's behavior matches the original, ensuring a seamless transition.

## Project Structure

- `src/`: Contains the application source code.
    - `auth/`: Authentication and authorization logic (Guards, Strategies, Decorators).
    - `common/`: Shared utilities, such as the Prisma exception filter, response middleware.
    - `modules/`: Contains the business logic for each resource (countries, devices, etc.).
    - `prisma/`: Prisma service for database interaction.
- `prisma/`: Contains the Prisma schema, migrations, and seed script.
    - `seed-data/`: The source `.json` files for seeding the database.
- `test/`: Contains the E2E test files (`*.e2e-spec.ts`).
- `Dockerfile`: For building a production-ready Docker image.
- `docker-compose.yml`: For running the local PostgreSQL database.

**Downstream Usage**

- This service is consumed by Topcoder apps to power country and device lookups. Below is a quick map of where and how it’s called to help with debugging.

**platform-ui**

- Country list for profile forms, fetched from Lookups API with a large page size to retrieve all entries:
  - `GET /v6/lookups/countries?page=1&perPage=9999`. See platform-ui/src/libs/core/lib/profile/profile-functions/profile-store/profile-endpoint.config.ts.
- Device selectors in Account Settings > Tools use device lookups for dependent dropdowns:
  - Device types: `GET /v6/lookups/devices/types`
  - Manufacturers by type: `GET /v6/lookups/devices/manufacturers?type={type}`
  - Models by type/manufacturer: `GET /v6/lookups/devices/models?type={type}&manufacturer={manufacturer}`
  - Filtered device lists (and OS info) via query params: `GET /v6/lookups/devices?type={type}&manufacturer={manufacturer}&model={model}&page=1&perPage=100`
  - See platform-ui/src/apps/accounts/src/settings/tabs/tools/devices/Devices.tsx and platform-ui/src/libs/core/lib/profile/data-providers/useMemberDevicesLookup.ts.
- Legacy path rewrite: requests to `/v6/members/lookup[s]/countries` are rewritten to `/v6/lookups/countries` by the XHR interceptor. See platform-ui/src/libs/core/lib/xhr/xhr-functions/xhr.functions.ts.
- Local dev proxy maps `/v6/lookups` to this service on port 3007. See platform-ui/src/config/environments/local.env.ts.

**community-app**

- Not use. Country and other metadata are sourced via other endpoints in this app.

**work-manager**

- Not used. Challenge and group management uses other APIs; device and country lookups are not currently integrated here.
