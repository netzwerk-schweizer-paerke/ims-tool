Swiss Parcs Network

# IMS Tool

## Overview

The IMS Tool (Information Management System) is a comprehensive web application developed for the Swiss Parcs Network to document, manage, and track their organizational processes. It is a multi-tenant, Payload CMS 3-based application where each park is represented as an organization with their own users, processes, activities, and documents.

## Key Features

- **Multi-tenant Architecture**: Each park operates within its own organizational context
- **Process Documentation**: Structured workflow for documenting park processes and activities
- **Task Management**: Create and track task flows and task lists
- **Document Management**: Upload, organize, and link documents to activities
- **Translation Support**: Integrated DeepL translation for multilingual content (DE, FR, IT)
- **Rich Text Editing**: Advanced content editing with Lexical Editor
- **User Management**: Role-based access control with organization-specific permissions
- **Activity Landscape**: Visual overview of organizational activities
- **Media Library**: Centralized storage for media assets

## Project Structure

```
ims-tool/
├── docker-compose/       # Docker configuration files
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js app router components
│   ├── components/       # Reusable UI components
│   │   └── organisation-select/ # Organization selection components
│   ├── config/           # Application configuration
│   ├── lib/              # Utility functions and shared code
│   ├── migrations/       # Database migrations
│   ├── payload/          # Payload CMS configuration
│   │   └── collections/  # Collection definitions
│   ├── plugins/          # Custom plugins
│   │   └── deeplTranslate/ # DeepL translation integration
│   └── tests/            # Unit and integration tests
├── .env                  # Environment variables
└── payload.config.ts     # Payload CMS configuration
```

## Technical Architecture

- **Frontend**: React 19, Next.js 15
- **Backend**: Payload CMS 3.x, Node.js 24+
- **Database**: PostgreSQL (via @payloadcms/db-postgres)
- **Storage**: S3-compatible storage (via @payloadcms/storage-s3)
- **Email**: Nodemailer integration (via @payloadcms/email-nodemailer)
- **Styling**: TailwindCSS
- **Testing**: Jest, ts-jest
- **Languages**: TypeScript, JavaScript, SCSS

### Core Collections

- **Organizations**: Represents individual parks in the network
- **Users**: User accounts with role-based permissions
- **Activities**: Main processes and activities documentation
- **TaskFlows**: Structured workflow definitions
- **TaskLists**: Task tracking and management
- **Documents**: Internal document management
- **DocumentsPublic**: Publicly accessible documents
- **Media**: Media asset management

### Custom Features

1. **Organization Context Switching**: Users can be part of multiple organizations and switch between them
2. **Rich Text Handling**: Advanced system for managing document links in rich text fields when cloning activities
3. **DeepL Translation**: Integrated translation system for multilingual content
4. **Arrow Rendering System**: Optimized UI component for visual relationships

## Installation and Setup

### Prerequisites

- Node.js 24 or later
- Docker and Docker Compose
- PostgreSQL 
- S3-compatible storage (e.g., AWS S3, Cloudflare R2)

### Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   yarn install
   ```
3. Copy the environment template:
   ```
   cp docker-compose/.env.template docker-compose/.env
   ```
4. Configure environment variables as described in the Configuration section
5. Start development services:
   ```
   yarn services:start
   ```
6. Start the development server:
   ```
   yarn dev
   ```

### Docker Setup

See `/docker-compose/docker-compose.yml` for the services required to run the application.

## Configuration

Configuration is done via environment variables. Check `/docker-compose/.env.template` for the required environment variables.
Key configuration includes:

- **Database**: PostgreSQL connection string
- **S3 Storage**: Endpoint, credentials, and bucket name
- **Email**: SMTP server configuration
- **DeepL API**: Translation service API key
- **Authentication**: Secret key for session encryption

## Development Scripts

- `yarn dev`: Start development server
- `yarn services:start`: Start required Docker services
- `yarn services:stop`: Stop Docker services
- `yarn build`: Build the application
- `yarn start`: Start production server
- `yarn migrate`: Run database migrations
- `yarn test`: Run unit tests
- `yarn test:watch`: Run tests in watch mode
- `yarn test:coverage`: Run tests with coverage reporting

## Releasing

1. Tag the main branch with a version number (e.g., `1.0.0`)
2. Push the tag and wait for the GitHub action to complete, a new docker image will be created and pushed to ghcr.io
3. Use the new image in your deployment

## License

This application is based on Payload CMS 3.x and the code in this repository is hereby licensed under the MIT license.

## Credits

This application was developed by [Tegonal Cooperative](https://tegonal.com) for Swiss Parcs Network.
