# ROSE Playbook Process Mapping Tool

A collaborative process mapping tool integrated with the ROSE Playbook methodology, enabling NGOs and businesses to design, customize, and deploy process workflows.

## Technology Stack

- **Frontend:** Next.js with TypeScript and React
- **Backend:** tRPC for type-safe API communication
- **Database:** PostgreSQL via Supabase
- **ORM:** Prisma
- **Styling:** Tailwind CSS
- **Authentication:** Supabase Auth

# Database 

## Database Connection

Supabase is a Postgresql database hosted in the cloud, and we are using Prisma to define our schema in a type-safe method to match our TypeScript stack. 

In order to connect to Supabase, we need to define the environment variables in `.env`. You can copy the variables from `.env.example` into `.env` and enter the database password in the `DATABASE_URL`. 

## Common Database Operations

### Setting Up

1. Install dependencies:
   `npm install`
2. Generate Prisma client
    `npx prisma generate`
3. Push Schema change to database
    `npx prisma db push`
        - Migrations are handled by Supabase
4. View local database data:
    `npx prisma studio`



## Database Architecture

The database is structured around several core entities:

### Core Entities

1. **User**: System users with authentication and role-based access
2. **Playbook**: Main container for process workflows
3. **Process**: Individual workflows with hierarchical nesting capabilities
4. **Node**: BPMN elements (tasks, events, gateways) within processes
5. **Parameter**: Customizable fields for process configuration

### Key Relationships

- **Process Hierarchy**: Processes can contain sub-processes through a self-referential relationship
- **Collaboration**: Users can be added as collaborators to playbooks with specific roles
- **Version Control**: Changes are tracked and full playbook states are saved as versions
- **Locking**: Nodes can be locked by users during editing to prevent conflicts

## Database Connection

The project uses Supabase as the database provider with Prisma as the ORM. Connection details are stored in the `.env` file:



