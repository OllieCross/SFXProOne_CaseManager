# Page Directory - SFXProOne CaseManager

All implemented routes. Update this file whenever a new page is added.

---

## Auth

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Credentials login form |

---

## Core Navigation

| Route | Access | Description |
|---|---|---|
| `/` | Any | Root redirect |
| `/scan` | Viewer+ | QR code scanner with manual fallback |
| `/changelog` | Viewer+ | Release notes rendered from CHANGELOG.md |
| `/admin` | Admin | User table with inline role selector and last 100 audit log entries |

---

## Inventory (Cases)

| Route | Access | Description |
|---|---|---|
| `/editor` | Viewer+ | Inventory overview: Cases, Devices, Consumables, Standalone Items with counts |
| `/editor/new` | Editor+ | Create new case (name, QR code, gear list, photos, PDFs) |
| `/editor/[id]` | Editor+ | Edit existing case |
| `/case/[id]` | Viewer+ | Case detail view: gear list, photos, documents |

---

## Devices

| Route | Access | Description |
|---|---|---|
| `/devices/new` | Editor+ | Create device (name, QR, serial, purchase date, status, case assignment, notes) |
| `/devices/[id]` | Viewer+ | Device detail: info card, photos, documents, logbook |
| `/devices/[id]/edit` | Editor+ | Edit device fields, photos, documents; add/delete logbook entries |

---

## Consumables

| Route | Access | Description |
|---|---|---|
| `/consumables/new` | Editor+ | Create consumable (name, unit, stock quantity, notes) |
| `/consumables/[id]/edit` | Editor+ | Edit consumable including manual stock adjustment |

---

## Groups

| Route | Access | Description |
|---|---|---|
| `/groups` | Viewer+ | List all group templates with member counts |
| `/groups/new` | Editor+ | Create group (name + add Cases/Devices/Items/Consumables) |
| `/groups/[id]/edit` | Editor+ | Edit group name and members |

---

## Events

| Route | Access | Description |
|---|---|---|
| `/events` | Viewer+ | Events list with status, invoice status, stagehands, inventory counts |
| `/events/new` | Editor+ | Create event (all fields + stagehands + inventory) |
| `/events/[id]` | Viewer+ | Event detail: info, stagehands, cases, devices, items, consumables |
| `/events/[id]/edit` | Editor+ | Edit event fields, inventory; add group template |

---

## Standalone Items

| Route | Access | Description |
|---|---|---|
| `/items/new` | Editor+ | Create standalone item |
| `/items/[id]/edit` | Editor+ | Edit standalone item |

---

## Notes

- **Viewer+** = VIEWER, EDITOR, ADMIN
- **Editor+** = EDITOR, ADMIN
- **Admin** = ADMIN only
- All routes redirect to `/login` if not authenticated
