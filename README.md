# Core Forge ClientOS

Core Forge ClientOS is an internal business operations web application intended to give the Core Forge team one place to manage clients, projects, invoices, company assets, document records, and internal messages.

This README explains the current codebase, how the main features fit together, how to run the application, and where contributors should look when making changes.

> **Project status:** This repository represents the current development version of ClientOS. Some modules are functional prototypes and some areas still need development. In particular, the current login and role checks are not production-grade security. Read [Security and current limitations](#security-and-current-limitations) before deploying or entering real business information.

---

## 1. What the application does

ClientOS is organised around two main areas:

- **Business Dashboard** – day-to-day operational modules such as clients, projects, invoices, assets, and document records.
- **Executive Command Center** – a consolidated view of operational and financial information, including invoice approval figures and asset statistics.

The application also includes a lightweight internal messaging interface in the dashboard layout.

### Main modules

| Module | Purpose | Current behaviour |
|---|---|---|
| Clients | Keep a directory of clients and their contact details. | Create, view, edit, and delete client records. |
| Projects | Track work being done for clients. | Create, view, edit, and delete projects; set a project status. |
| Invoices & Approvals | Record supplier/client invoices and track sign-off. | Submit invoice records, attach a file as data, edit eligible records, and change approval status. |
| Asset Management | Keep an inventory of company equipment and its allocation. | Asset listing and CRUD interface are present; see the asset-field mismatch noted below. |
| Document Repository | Keep a searchable-style list of internal document records. | Creates and lists document metadata. It does not currently implement a complete file-storage/upload service. |
| Finance Overview | Show totals derived from invoice records. | Displays total, pending, and approved/paid amounts. |
| Executive Command Center | Provide a management overview. | Combines invoice, document, and asset information into summary metrics. |
| Internal Messages | Allow team members to exchange messages. | Stores messages in MongoDB and refreshes conversations periodically. |
| User Management | Maintain user records and roles. | Admin page provides user CRUD controls; server-side access control still needs to be implemented. |

---

## 2. Technology stack

The current project uses:

- **Next.js 16** – application framework, routing, and server-side API route handlers.
- **React 19** – interactive user interfaces and component state.
- **JavaScript / JSX** – application code.
- **Tailwind CSS 4** – styling.
- **MongoDB** – persistent data store.
- **Mongoose** – MongoDB object modelling and database queries.
- **ESLint** – code linting.

The project uses the Next.js App Router. Pages are inside `src/app`, and API endpoints are implemented as route handlers inside `src/app/api`.

---

## 3. How the application is structured

A simplified request/data flow looks like this:

```text
User's browser
    |
    | Opens a page / interacts with a form
    v
Next.js page or React component
    |
    | fetch("/api/...")
    v
Next.js API route handler
    |
    | Mongoose model query
    v
MongoDB database
    |
    | JSON response
    v
React updates the page
```

For example, when a team member adds a client:

1. The Clients page collects the form values.
2. The page sends a `POST` request to `/api/clients`.
3. `src/app/api/clients/route.js` receives the request.
4. The route connects to MongoDB through `connectToDB()`.
5. The `Client` Mongoose model creates a record.
6. The API returns JSON containing the new record.
7. The page refreshes its client list so the new record appears.

This same general pattern is used by most of the CRUD modules.

### Important folders

```text
src/
├── app/
│   ├── api/                 # Backend API route handlers
│   │   ├── assets/
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── invoices/
│   │   ├── messages/
│   │   ├── projects/
│   │   └── users/
│   ├── admin/               # User management screen
│   ├── dashboard/           # Main operational application
│   │   ├── assets/
│   │   ├── clients/
│   │   ├── documents/
│   │   ├── finance/
│   │   ├── invoices/
│   │   └── projects/
│   ├── portal/               # Executive Command Center
│   ├── welcome/              # Landing page after the current login flow
│   ├── layout.jsx            # Root layout and global styles
│   └── page.jsx              # Login screen (/)
├── components/               # Reusable UI components
├── lib/
│   ├── auth.js               # Current browser-side user helper functions
│   └── db.js                 # MongoDB connection helper
└── models/                   # Mongoose schemas/models
```

### Important files

- `src/lib/db.js` – reads `MONGODB_URI` and establishes/reuses a Mongoose connection.
- `src/lib/auth.js` – reads and writes the current user in browser `localStorage`.
- `src/app/dashboard/layout.jsx` – shared dashboard navigation/layout and internal messaging interface.
- `src/models/*.js` – define the shape of MongoDB records.
- `src/app/api/*/route.js` – implement the application's data operations.

---

## 4. Pages and navigation

| URL | Page |
|---|---|
| `/` | Login screen |
| `/welcome` | Welcome page with links to the Business Dashboard and Executive Command Center |
| `/dashboard` | Business Overview and quick links |
| `/dashboard/clients` | Client management |
| `/dashboard/projects` | Project management |
| `/dashboard/invoices` | Invoice submission and approval workflow |
| `/dashboard/assets` | Asset management |
| `/dashboard/documents` | Document record repository |
| `/dashboard/finance` | Financial totals based on invoice records |
| `/portal` | Executive Command Center |
| `/admin` | User management screen |

The dashboard pages share `src/app/dashboard/layout.jsx`, which provides the common navigation and messaging UI.

---

## 5. How each module works

### 5.1 Clients

**Frontend:** `src/app/dashboard/clients/page.jsx`  
**API:** `src/app/api/clients/route.js`  
**Model:** `src/models/Client.js`

The Clients module stores client contact records. The current model defines:

- `name` – client or company name (required).
- `email` – client email address (required).
- `status` – defaults to `Active`.
- `projects` – numeric count, defaults to `0`.
- `createdAt` / `updatedAt` – automatically maintained by Mongoose timestamps.

The page loads records from `GET /api/clients`. It uses `POST` to create a client, `PUT` to update a client, and `DELETE /api/clients?id=...` to remove one.

**Contributor note:** The page currently also sends `phone` and `company`, but those fields are not defined in the current `Client` schema. If these details should be stored, add them to the schema and confirm the API accepts and validates them.

### 5.2 Projects

**Frontend:** `src/app/dashboard/projects/page.jsx`  
**API:** `src/app/api/projects/route.js`  
**Model:** `src/models/Projects.js`

Projects represent work being delivered. The model currently contains:

- `title` – project name (required).
- `description` – optional description.
- `status` – `In Progress`, `Completed`, or `On Hold`.
- `client` – client name as a text value.
- `createdAt` / `updatedAt` – timestamps.

The page supports creating, editing, listing, and deleting projects. Project status is currently stored as a string. The project is linked to a client by its name, not by a MongoDB client ID/reference.

**Possible future improvement:** Use a MongoDB reference to the Client model rather than storing only the client's name. This would make client/project relationships more reliable if a client name changes.

### 5.3 Invoices and approvals

**Frontend:** `src/app/dashboard/invoices/page.jsx`  
**API:** `src/app/api/invoices/route.js`  
**Model:** `src/models/Invoice.js`

Invoices have the most developed workflow in the current application.

The current statuses are:

- `Pending Manager Approval` – newly submitted invoice; awaiting a decision.
- `Approved` – approved by a manager/admin.
- `Rejected` – rejected and may be corrected and resubmitted.
- `Paid` – marked as paid.

When an invoice is submitted, the API sets its status to `Pending Manager Approval`. If the submitter does not provide an invoice number, the API generates one in the format `INV-0001`, `INV-0002`, and so on.

The record includes the invoice number, client/vendor name, amount in ZAR, submitter name/email, status, approval details, and an optional document data field.

The API supports these operations:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/invoices` | Retrieve invoice records. |
| POST | `/api/invoices` | Submit a new invoice. |
| PUT | `/api/invoices` | Edit an invoice, subject to the current client-supplied role/owner checks. |
| PATCH | `/api/invoices` | Change invoice status. |
| DELETE | `/api/invoices?id=...` | Delete an invoice, subject to the current client-supplied role/owner checks. |

Normal-user invoice listing uses the `submittedBy` query parameter. The UI requests only the current user's records, while the Admin UI requests all invoices.

**Attachment behaviour:** The invoice page reads a selected file in the browser and converts it to a Base64 data URL. That value is sent as `documentUrl` and stored in MongoDB. This is not the same as using dedicated file/object storage. Large attachments can increase database size and request payloads.

**Approval flow:**

1. A user submits an invoice.
2. It enters `Pending Manager Approval`.
3. An Admin can approve or reject it.
4. A rejected invoice can be edited by its submitter and is returned to the pending state.
5. An Admin can mark an invoice as `Paid`.

The Executive Command Center calculates pending and approved/paid totals from these records.

### 5.4 Asset management

**Frontend:** `src/app/dashboard/assets/page.jsx`  
**API:** `src/app/api/assets/route.js`  
**Model:** `src/models/Asset.js`

The intended purpose is to record company equipment, its category, tag/serial number, allocation, status, and purchase value.

The current Mongoose model uses these field names:

- `name`
- `category`
- `tagNumber`
- `assignedTo`
- `status`
- `purchaseValue`

**Known issue to resolve:** The current Assets page/API use `serialNumber` and `allocatedTo`, while the model requires `tagNumber` and defines `assignedTo`. The page's create request therefore does not line up with the model's required field. Align the frontend, API, and schema on one consistent naming convention before relying on asset creation or allocation. Also check that the edit form sends and displays `purchaseValue` if that value is meant to be editable.

### 5.5 Document repository

**Frontend:** `src/app/dashboard/documents/pages.jsx`  
**API:** `src/app/api/documents/route.js`  
**Model:** `src/models/Document.js`

The repository currently stores document metadata:

- `title`
- `category` (defaults to `Internal Brief`)
- `clientName` (defaults to `General Operations`)
- `fileUrl` (defaults to `#`)
- `uploadedBy`
- timestamps

At present, the form creates a document record; it does not implement a complete file picker, upload pipeline, or persistent storage provider. A record in this module should therefore be understood as a document entry/reference, not proof that a file has been uploaded and stored.

A future implementation could use private object storage and save the resulting secure file URL in `fileUrl`.

### 5.6 Finance overview

**Frontend:** `src/app/dashboard/finance/page.jsx`  
**Data source:** `/api/invoices`

This page calculates:

- Total invoice volume.
- Pending invoice amount.
- Approved/paid amount.

These are calculated from invoice records; this module is currently a reporting view rather than a full accounting system. It does not replace bookkeeping, bank reconciliation, tax reporting, or a formal accounting ledger.

### 5.7 Executive Command Center

**Frontend:** `src/app/portal/page.jsx`

The portal requests invoice, document, and asset data and combines them into management metrics, including:

- Pending invoice count and value.
- Approved/paid invoice totals.
- An approval progress percentage.
- Document record count and recent document entries.
- Number of checked-out assets.
- Asset catalogue valuation based on `purchaseValue`.

The page also includes a manager approval action for the first pending invoice when the current browser-side user has the `Admin` role.

The figures are derived from the records currently returned by the APIs. They should be treated as operational summaries, not audited financial statements.

### 5.8 Internal messaging

**Frontend:** `src/app/dashboard/layout.jsx`  
**API:** `src/app/api/messages/route.js`  
**Model:** `src/models/Message.js`

The shared dashboard layout contains the internal chat interface. Messages are stored with:

- Sender email and name.
- Recipient email.
- Message content.
- Read/unread state.
- `hiddenFor`, an array used to hide a message or conversation from one user's view.
- Timestamps.

The interface periodically refreshes unread counts, conversation lists, and the open conversation. This is polling, not a WebSocket/realtime push implementation. The current intervals are short, so consider the database/request load if the number of users grows.

### 5.9 User management

**Frontend:** `src/app/admin/page.jsx`  
**API:** `src/app/api/users/route.js`  
**Model:** `src/models/User.js`

User records contain a name, email, password, and role. The allowed role values in the model are:

- `Admin`
- `Normal User`

The API's GET and normal create/update responses exclude the password field from returned user objects. However, the current implementation stores passwords as plain text when creating/updating users. This must be replaced with secure password hashing before real accounts are used.

---

## 6. Database models

The Mongoose models are in `src/models/`.

| Model | Collection purpose | Main fields |
|---|---|---|
| `User` | Team accounts | name, email, password, role |
| `Client` | Client directory | name, email, status, projects |
| `Project` | Work/projects | title, description, status, client |
| `Invoice` | Invoice records and approval state | invoiceNumber, clientName, amount, status, submitter and approval details, documentUrl |
| `Asset` | Equipment inventory | name, category, tagNumber, assignedTo, status, purchaseValue |
| `Document` | Document metadata | title, category, clientName, fileUrl, uploadedBy |
| `Message` | Internal messages | sender, recipient, content, read, hiddenFor |

Mongoose timestamps automatically add `createdAt` and `updatedAt` to models configured with `{ timestamps: true }`.

---

## 7. API route reference

All API routes are under `/api`.

| Endpoint | Supported methods | Description |
|---|---|---|
| `/api/users` | GET, POST, PUT, DELETE | List, create, update, and delete user records. |
| `/api/clients` | GET, POST, PUT, DELETE | Client CRUD operations. |
| `/api/projects` | GET, POST, PUT, DELETE | Project CRUD operations. |
| `/api/invoices` | GET, POST, PUT, PATCH, DELETE | Invoice records and approval workflow. |
| `/api/assets` | GET, POST, PUT, DELETE | Asset CRUD operations. |
| `/api/documents` | GET, POST | List and create document metadata records. |
| `/api/messages` | GET, POST, DELETE | Retrieve conversations/unread counts, send messages, and hide messages/conversations. |

Most endpoints return JSON in a consistent general shape:

```json
{
  "success": true,
  "data": []
}
```

On failure, the response generally includes `success: false` and an `error` message. Check the individual route handler for exact request fields and status codes before changing or integrating an endpoint.

---

## 8. Running the project locally

### Prerequisites

Install:

- Node.js (use a current LTS release compatible with the installed Next.js version).
- npm.
- Access to a MongoDB database, either a local MongoDB instance or a MongoDB Atlas database.

### Installation

Clone the repository and enter the project folder:

```bash
git clone <repository-url>
cd <project-folder>
```

Install dependencies:

```bash
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

Replace the placeholder values with the connection string for the development database. Keep `.env.local` private and make sure it is excluded by `.gitignore`. Never commit database credentials or production secrets.

The database helper in `src/lib/db.js` throws an error if `MONGODB_URI` is missing.

### Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Other useful commands

```bash
npm run build
npm run start
npm run lint
```

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run start` serves the production build (run after a successful build).
- `npm run lint` runs ESLint.

---

## 9. Working on the codebase

A few conventions will make collaboration easier:

1. **Keep the layers aligned.** When adding or renaming a data field, check the page form, API route, and Mongoose schema together.
2. **Keep database access in API routes.** Client components should call `/api/...`; they should not connect directly to MongoDB.
3. **Use the existing response pattern.** Return JSON with a `success` flag and either `data` or an error message.
4. **Refresh the UI after mutations.** Existing pages generally fetch the updated list after a create, edit, or delete operation.
5. **Use model validation.** Required fields and allowed status values should be defined in the Mongoose schema and validated at the API boundary.
6. **Avoid committing secrets.** Keep `.env.local`, database credentials, API keys, and private deployment settings out of Git.
7. **Test the full workflow.** Test not only whether a form submits, but also whether the record is stored correctly and appears as expected after a page reload.
8. **Be careful with shared data.** The current APIs generally return shared records; do not assume records are private to a user unless the route explicitly filters them.

### Suggested workflow for a new feature

1. Agree on the feature and the data it needs.
2. Update or create the Mongoose model.
3. Implement the API route and validation.
4. Build the page/component and connect it to the API with `fetch`.
5. Test success cases, missing fields, invalid IDs, and server/database errors.
6. Check that the feature still works after refreshing the browser.
7. Update this README if the feature changes the way the application is used.

---

## 10. Security and current limitations

**This section is important. The current code should be treated as a development prototype, not a secure production business system.**

The repository currently has several security and implementation gaps:

1. **Login does not verify the password.** The login page reads the email and password fields, but it searches for a matching user by email only. The password is not checked against the stored password.
2. **The current session is browser-side only.** The selected user is stored in `localStorage`. This is not a secure server-authenticated session.
3. **Roles are trusted from the browser.** Some invoice API checks rely on `actorRole` or `actorEmail` sent by the client. A user can modify browser data or make direct API requests, so these checks do not provide real authorisation.
4. **API routes are not consistently protected.** Several routes allow read/write operations without verifying an authenticated user or their permissions. The `/admin` page is also a UI route, not a server-side security boundary.
5. **Passwords are stored as plain text.** User passwords must be hashed using a suitable password-hashing algorithm (for example, Argon2id or bcrypt) and verified on the server. Existing plain-text passwords should not be carried into a production authentication system.
6. **Document storage is incomplete.** The document repository currently creates metadata records; it does not upload files to secure storage. Invoice attachments are stored as Base64 data in MongoDB, which is not ideal for larger files.
7. **Some fields do not match.** The asset page/API and asset model currently disagree on field names. Client forms also send `phone` and `company`, which are not in the current Client schema.
8. **Validation needs strengthening.** API routes should validate data types, amount ranges, allowed fields, IDs, file sizes/types, and permissions on the server.
9. **No production audit trail is established.** Approval metadata exists on invoices, but a broader immutable audit log for sensitive business actions is not implemented.

### Before production use, prioritise

- Implement server-side authentication (for example, a properly configured Auth.js/NextAuth or another maintained authentication solution).
- Hash passwords and add a secure password reset/change process.
- Enforce permissions inside every API route using the authenticated server-side session; never trust a role supplied in request JSON or query parameters.
- Protect `/admin` and all other restricted pages on the server.
- Review database access rules, input validation, rate limiting, logging, backups, and secret management.
- Move uploaded files to private object storage and store controlled file references in MongoDB.
- Fix the asset/client schema mismatches and test the affected workflows.
- Add automated tests for authentication, permissions, CRUD operations, and invoice approvals.

Do not use real customer, financial, or confidential company data until these issues have been addressed and reviewed.

---

## 11. Recommended next development priorities

A sensible order for improving the current application is:

1. **Authentication and authorisation** – secure login, password hashing, server sessions, and server-side role checks.
2. **Data consistency** – fix the Asset field mismatch and decide whether Client phone/company fields should be persisted.
3. **Document/file handling** – implement actual uploads with file type/size validation and private storage.
4. **Validation and error handling** – standardise API validation and provide clear feedback in the UI.
5. **Testing** – add tests for the main workflows, especially invoice approvals and role permissions.
6. **Auditability** – record who performed important actions and when.
7. **Scalability** – review polling intervals and consider a realtime messaging approach if usage grows.

---

## 12. Contribution guidelines

Before pushing changes:

- Pull the latest changes from the shared branch.
- Work on a separate feature branch rather than making unrelated changes directly on the main branch.
- Keep commits focused and use clear commit messages.
- Do not commit `.env.local`, secrets, database exports, or private customer files.
- Run `npm run lint` and `npm run build` where possible.
- Explain changes to database schemas and API request/response formats in the pull request.
- If a change affects a workflow, include the steps used to test it.

Suggested branch names:

```text
feature/client-contact-fields
feature/secure-authentication
fix/asset-schema-fields
feature/document-upload
```

---

## 13. Quick troubleshooting

| Problem | Things to check |
|---|---|
| App fails to start because `MONGODB_URI` is missing | Confirm `.env.local` exists in the project root and contains a valid `MONGODB_URI`. Restart the dev server after changing environment variables. |
| MongoDB connection fails | Check the connection string, database credentials, network access/IP allowlist, and database availability. |
| A page loads but shows no records | Check the browser console, terminal output, API response, and whether the app is connected to the expected database. |
| A create/update action fails | Inspect the Network tab in browser developer tools, check the API response, and compare submitted field names with the Mongoose schema. |
| Changes do not appear | Confirm the API request succeeded and that the page refreshes or refetches its data. |
| Build or lint errors occur | Run `npm run lint` and `npm run build`, then resolve the reported file and line issues. |

---

## 14. Final note

ClientOS is intended to become a shared internal workspace for Core Forge. The best way to work on it is to understand the flow between the **React page**, the **Next.js API route**, the **Mongoose model**, and **MongoDB**. When all four agree on the data structure and responsibilities, the application is much easier to maintain and extend.
