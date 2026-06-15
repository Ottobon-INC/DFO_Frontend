# Backend Task: Leads Import & Export Support

We are implementing Bulk Import and Export features for the Leads Pipeline. Currently, these are handled client-side, but we need backend support for performance and scalability (handling large datasets).

## 1. Bulk Import Endpoint
**Objective:** Allow uploading/creating multiple leads in a single request to avoid network overhead.

- **Endpoint:** `POST /api/leads/bulk`
- **Description:** Accepts an array of lead objects or a CSV file.
- **Request Type:** `application/json` (Preferred for now if frontend parses) OR `multipart/form-data` (if uploading raw CSV).
- **JSON Payload Example:**
  ```json
  {
    "leads": [
      {
        "name": "John Doe",
        "phone": "9876543210",
        "source": "Walk-in",
        "status": "New Inquiry",
        "date_added": "2024-01-20T10:00:00Z"
      },
      { "name": "Jane Smith", "phone": "..." }
    ]
  }
  ```
- **Logic:**
  1. Validate each lead (check duplicates by phone).
  2. Batch insert valid leads.
  3. **Response:** Return a summary.
     ```json
     {
       "success": true,
       "count": 50,
       "failed": 2,
       "errors": [
         { "phone": "123...", "reason": "Duplicate" }
       ]
     }
     ```

## 2. Export Leads Endpoint
**Objective:** Generate a CSV of *all* matching leads, bypassing frontend pagination limits.

- **Endpoint:** `GET /api/leads/export`
- **Query Parameters:** Matching the `GET /api/leads` filters.
  - `status`: (Optional) e.g., 'New Inquiry', 'Converted'
  - `q`: (Optional) Search term
- **Response Headers:**
  - `Content-Type: text/csv`
  - `Content-Disposition: attachment; filename="leads_export.csv"`
- **Why?** The frontend can only export what is currently loaded/visible. A backend export ensures the user gets the **entire** dataset matching their filter.
