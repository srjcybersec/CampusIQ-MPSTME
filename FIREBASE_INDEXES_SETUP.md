# Firebase Firestore Indexes Setup Guide

## Step-by-Step Instructions to Create Database Indexes

### Index 1: Canteen Orders (userId + createdAt)

**Purpose:** Enable efficient querying of user orders sorted by creation date

**Steps:**

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your project name (e.g., "CampusIQ-MPSTME" or your project name)
   - Wait for the project dashboard to load

3. **Navigate to Firestore Database**
   - In the left sidebar, look for **"Firestore Database"** or **"Firestore"**
   - Click on it
   - If you see "Cloud Firestore" instead, click that

4. **Go to Indexes Tab**
   - At the top of the Firestore page, you'll see tabs: **"Data"**, **"Indexes"**, **"Rules"**, **"Usage"**
   - Click on the **"Indexes"** tab

5. **Create New Index**
   - You'll see a button that says **"Create Index"** or **"Add Index"**
   - Click on it
   - A form/dialog will appear

6. **Fill in Index Details**
   - **Collection ID:** Type `canteenOrders` (exactly as shown, case-sensitive)
   - **Query scope:** Select **"Collection"** (should be default)

7. **Add Fields**
   - Click **"Add field"** or the **"+"** button next to Fields
   - **Field:** Type `userId`
   - **Order:** Select **"Ascending"** (or **"Asc"**)
   - Click **"Add field"** again
   - **Field:** Type `createdAt`
   - **Order:** Select **"Descending"** (or **"Desc"**)

8. **Create the Index**
   - Review your fields:
     - `userId` - Ascending
     - `createdAt` - Descending
   - Click the **"Create"** or **"Create Index"** button at the bottom

9. **Wait for Index Creation**
   - You'll see the index appear in the list with status **"Building"** (yellow/orange indicator)
   - This can take a few minutes
   - Refresh the page periodically to check status
   - When ready, status will change to **"Enabled"** (green indicator)

---

### Index 2: Schedules (userId + day + startTime)

**Purpose:** Enable efficient querying of schedules by user, day, and time

**Steps:**

1. **Stay in Indexes Tab**
   - You should still be on the **"Indexes"** tab in Firestore

2. **Create Another Index**
   - Click **"Create Index"** or **"Add Index"** again

3. **Fill in Index Details**
   - **Collection ID:** Type `schedules` (exactly as shown, case-sensitive)
   - **Query scope:** Select **"Collection"**

4. **Add Fields**
   - Click **"Add field"**
   - **Field:** Type `userId`
   - **Order:** Select **"Ascending"**
   - Click **"Add field"** again
   - **Field:** Type `day`
   - **Order:** Select **"Ascending"**
   - Click **"Add field"** again
   - **Field:** Type `startTime`
   - **Order:** Select **"Ascending"**

5. **Create the Index**
   - Review your fields:
     - `userId` - Ascending
     - `day` - Ascending
     - `startTime` - Ascending
   - Click **"Create"** or **"Create Index"**

6. **Wait for Index Creation**
   - Status will show **"Building"** then change to **"Enabled"** when ready

---

### Index 3: Assignments (userId + dueDate)

**Purpose:** Enable efficient querying of assignments by user and due date

**Steps:**

1. **Stay in Indexes Tab**
   - Still on the **"Indexes"** tab

2. **Create Another Index**
   - Click **"Create Index"** or **"Add Index"** again

3. **Fill in Index Details**
   - **Collection ID:** Type `assignments` (exactly as shown, case-sensitive)
   - **Query scope:** Select **"Collection"**

4. **Add Fields**
   - Click **"Add field"**
   - **Field:** Type `userId`
   - **Order:** Select **"Ascending"**
   - Click **"Add field"** again
   - **Field:** Type `dueDate`
   - **Order:** Select **"Ascending"**

5. **Create the Index**
   - Review your fields:
     - `userId` - Ascending
     - `dueDate` - Ascending
   - Click **"Create"** or **"Create Index"**

6. **Wait for Index Creation**
   - Status will show **"Building"** then change to **"Enabled"** when ready

---

## Visual Guide (What You'll See)

### Indexes Tab Layout:
```
┌─────────────────────────────────────────┐
│ Firestore Database                      │
├─────────────────────────────────────────┤
│ [Data] [Indexes] [Rules] [Usage]       │ ← Click "Indexes"
├─────────────────────────────────────────┤
│                                         │
│  [+ Create Index]  ← Click this button │
│                                         │
│  Existing Indexes:                      │
│  ┌───────────────────────────────────┐ │
│  │ Collection: canteenOrders         │ │
│  │ Fields: userId (Asc), createdAt   │ │
│  │ Status: Building...               │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

### Create Index Dialog:
```
┌─────────────────────────────────────────┐
│ Create Index                            │
├─────────────────────────────────────────┤
│ Collection ID: [canteenOrders    ]     │ ← Type here
│                                         │
│ Query scope: ( ) Collection             │ ← Select this
│                                         │
│ Fields:                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Field: [userId    ] Order: [Asc ▼] │ │ ← Add field
│ └─────────────────────────────────────┘ │
│ [+ Add field]                           │ ← Click to add more
│                                         │
│              [Cancel]  [Create Index]  │ ← Click Create
└─────────────────────────────────────────┘
```

---

## Important Notes

### Field Names Must Match Exactly
- Use lowercase: `userId` not `UserId` or `user_id`
- Use camelCase: `createdAt` not `created_at` or `CreatedAt`
- Use exact field names as they appear in your Firestore documents

### Index Status
- **Building:** Index is being created (can take 2-10 minutes)
- **Enabled:** Index is ready to use (green checkmark)
- **Error:** Something went wrong (check field names)

### If Index Creation Fails
1. Check that field names match exactly (case-sensitive)
2. Verify the collection exists and has documents with these fields
3. Try creating the index again
4. Check Firebase Console for error messages

### Testing Indexes
After indexes are enabled:
1. Go to **"Data"** tab in Firestore
2. Try querying the collections
3. Queries should be faster and won't show warnings

---

## Quick Checklist

- [ ] Index 1: `canteenOrders` - `userId` (Asc) + `createdAt` (Desc)
- [ ] Index 2: `schedules` - `userId` (Asc) + `day` (Asc) + `startTime` (Asc)
- [ ] Index 3: `assignments` - `userId` (Asc) + `dueDate` (Asc)

**All indexes show "Enabled" status** ✅

---

## Alternative: Using Firebase CLI

If you prefer command line, you can also create indexes using Firebase CLI:

1. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Create `firestore.indexes.json`** in your project root:
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "canteenOrders",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       },
       {
         "collectionGroup": "schedules",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "day", "order": "ASCENDING" },
           { "fieldPath": "startTime", "order": "ASCENDING" }
         ]
       },
       {
         "collectionGroup": "assignments",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "dueDate", "order": "ASCENDING" }
         ]
       }
     ]
   }
   ```

4. **Deploy indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

---

**Last Updated:** $(date)  
**Status:** Ready to create indexes
