# Table Management System

A robust, dynamic database management interface designed for secure record manipulation, comprehensive audit logging, and role-based access control.

## 📋 Project Overview
This system provides a secure interface for authorized users to view, add, update, and delete records across various database tables. It replaces legacy, insecure administrative access with a controlled, audited, and modern architecture, ensuring data integrity and regulatory compliance.

## 📂 Project Structure
```text
/TABLEMANAGEMENT
  /backend             # .NET 8 API (Layered: API, BI, DAL, Contracts)
  /database            # SQL Server Stored Procedures
  /frontend            # Angular 19 Application
```
## 🚀 Key Features
* **Modern UI (Angular 19):** Built with Angular 19, featuring real-time column filtering, global search, and intuitive modal-based forms.
* **Strict Security Architecture:**
    * **No Dynamic SQL:** All operations are executed via pre-defined Stored Procedures.
    * **Parameterized Queries:** Utilizes Dapper with Bind Variables to completely neutralize SQL Injection risks.
    * **Input Sanitization:** Strong server-side validation against malicious patterns (e.g., `SELECT`, `DROP`, `DELETE` keywords).
* **Audit & Accountability:** Every modification requires a mandatory "Reason for Change" entry, which is logged for compliance and security oversight.

## 🛠 Technical Stack
* **Frontend:** Angular 19, TypeScript, RxJS, SCSS.
* **Backend:** .NET 8 (API Layer, Business Logic, Dapper for Data Access).
* **Database:** SQL Server (Designed with Oracle-compatible abstraction for future migration).

## ⚙️ Development Guide
### Prerequisites
* **.NET 8 SDK**
* **Angular CLI** (v19)
* **Node.js**

## ⚡Setup Guide
### 1. Database Setup
Before starting, you must initialize the database:
1. Open SQL Server Management Studio (SSMS).
2. Run the script located at /database/createDB.sql to set up the tables and data.
3. Run all additional scripts located in the /database folder to set up the stored procedures.


### 2. Backend Setup
1. Open backend/TableManagementApi and open a new file called .env .
2. Copy .env.sample to .env.
3. Open .env and update the connection details.
4. Navigator to the backend/TableManagementApi directory, run the API:
```bash
dotnet run
```

### 2. Backend Setup
1. Navigator to frontend/TableManagementUI/src/app , run:

**Install Dependencies:**
```bash
npm install
```
**Code Formatting**
To maintain consistent code style and import ordering, run:

```bash
npm run front-format
```
2.Run:
```bash
ng serve
```

## 🛡 Security Protocols
The system is built on the "Zero Trust" principle regarding client-side data:
1.  **Validation Layers:** Multi-stage validation occurs both in the Angular UI and the .NET Business Logic.
2.  **Stored Procedures:** Direct table access is restricted. The database layer only accepts calls to specific, vetted procedures.
3.  **Role-Based Access:** UI elements are dynamically rendered based on the `PermissionsService`, ensuring users only interact with functions they are authorized to use.
4.  **Audit Logging:** Every write operation is timestamped and attributed to the specific user, including the justification provided.