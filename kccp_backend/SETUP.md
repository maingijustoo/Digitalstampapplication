# KCCP – Digital Stamp Platform
## Backend Setup & Frontend Integration Guide

---

## Project Structure

```
kccp_backend/                  ← Django backend (this folder)
│
├── manage.py
├── requirements.txt
│
├── kccp_project/              ← Django project config
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── stamps/                    ← Core Django app
│   ├── models.py              ← StampType, Applicant, StampApplication, StampRecord, AuditLog
│   ├── serializers.py         ← DRF serializers
│   ├── views.py               ← All API endpoints + button actions
│   ├── urls.py                ← URL routing
│   ├── admin.py               ← Django admin config
│   └── management/commands/
│       └── seed_data.py       ← Populate initial stamp types
│
└── frontend_api/              ← Drop into your React src/ folder
    ├── api.ts                 ← All fetch calls (one function per button)
    ├── index.ts               ← Barrel export
    ├── kccp.css               ← Global CSS utilities
    ├── App.tsx                ← Root component (replace your src/App.tsx)
    ├── hooks/
    │   ├── useDashboard.ts
    │   ├── useApplications.ts
    │   ├── useApplication.ts
    │   ├── useApplicants.ts
    │   └── useStampTypes.ts
    └── components/
        ├── DashboardStats.tsx
        ├── ApplicationsTable.tsx
        ├── ApplicationDetailPage.tsx
        ├── ApplicationActions.tsx
        ├── NewApplicationForm.tsx
        └── AuditLogTimeline.tsx
```

---

## 1 — Django Backend Setup

```bash
# Clone / enter the backend folder
cd kccp_backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (creates db.sqlite3)
python manage.py migrate

# Seed initial stamp types
python manage.py seed_data

# Create an admin account (optional, for /admin/)
python manage.py createsuperuser

# Start the dev server
python manage.py runserver
# → API live at http://localhost:8000/api/
# → Admin UI at http://localhost:8000/admin/
```

---

## 2 — React Frontend Setup

### Copy the API layer into your project

```bash
# From inside your React project root
cp -r kccp_backend/frontend_api src/
```

### Update src/main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './frontend_api/App';
import './frontend_api/kccp.css';   // ← add this import

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Set the API URL (optional)

Create a `.env` file in your React root:

```env
VITE_API_URL=http://localhost:8000/api
```

The API client defaults to `http://localhost:8000/api` if this is not set.

### Run the React app

```bash
npm install
npm run dev
# → http://localhost:5173
```

---

## 3 — Full API Reference

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/` | Summary counts and fees collected |

### Stamp Types
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stamp-types/` | List all stamp types |
| POST | `/api/stamp-types/` | Create new type |
| GET | `/api/stamp-types/{id}/` | Get one |
| PUT | `/api/stamp-types/{id}/` | Update |
| DELETE | `/api/stamp-types/{id}/` | Delete |

### Applicants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applicants/?search=name` | Search applicants |
| POST | `/api/applicants/` | Register new applicant |
| GET | `/api/applicants/{id}/` | Get one |
| PUT | `/api/applicants/{id}/` | Update |
| GET | `/api/applicants/{id}/applications/` | All applications for this applicant |

### Applications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/applications/` | List all (supports `?status=`, `?search=`, `?priority=`) |
| POST | `/api/applications/` | Create new (status = draft) |
| GET | `/api/applications/{id}/` | Full detail with audit log |
| PUT | `/api/applications/{id}/` | Update fields |
| DELETE | `/api/applications/{id}/` | Delete draft |

### Button Actions (all POST)
| Endpoint | Button | Transition |
|----------|--------|------------|
| `/api/applications/{id}/submit/` | Submit | draft → submitted |
| `/api/applications/{id}/review/` | Start Review | submitted → under_review |
| `/api/applications/{id}/approve/` | Approve | under_review → approved |
| `/api/applications/{id}/reject/` | Reject | submitted/under_review → rejected |
| `/api/applications/{id}/cancel/` | Cancel | any → cancelled |
| `/api/applications/{id}/record_payment/` | Mark Paid | sets fee_paid = true |
| `/api/applications/{id}/issue_stamp/` | Issue Stamp | approved + paid → issued |
| `/api/applications/{id}/audit_log/` | — (GET) | Full audit trail |

---

## 4 — Migrating to PostgreSQL

1. Install the driver:
   ```bash
   pip install psycopg2-binary
   ```

2. Create the database:
   ```sql
   CREATE DATABASE kccp_db;
   CREATE USER kccp_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE kccp_db TO kccp_user;
   ```

3. Update `kccp_project/settings.py`:
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': 'kccp_db',
           'USER': 'kccp_user',
           'PASSWORD': 'your_password',
           'HOST': 'localhost',
           'PORT': '5432',
       }
   }
   ```

4. Re-run migrations:
   ```bash
   python manage.py migrate
   python manage.py seed_data
   ```

That's it — no model changes needed. All data moves with you.

---

## 5 — Production Checklist

- [ ] Set `DEBUG = False` in settings.py
- [ ] Change `SECRET_KEY` to a long random string
- [ ] Set `ALLOWED_HOSTS` to your real domain
- [ ] Set `CORS_ALLOW_ALL_ORIGINS = False` and list your frontend domain
- [ ] Switch to PostgreSQL
- [ ] Configure `STATIC_ROOT` and run `collectstatic`
- [ ] Serve via gunicorn + nginx (not the Django dev server)
- [ ] Set `VITE_API_URL` in your React build environment
