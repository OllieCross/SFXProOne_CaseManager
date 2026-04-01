# Build Phases - SFXProOne CaseManager

Tracks planned implementation work. Each phase is self-contained and deployable.
Reference database.md for the full data model spec.

---

## Phase 1 - Database: Core New Models [DONE]

Migration: `20260401000000_add_device_consumable`

### Case (additive only)

- Add `warehouseLocation String?`
- Add `notes String?`

### New enum: DeviceStatus

`Working / Faulty / InRepair / Retired / Lost / RentedToFriend`

### New model: Device

- `id`, `name`, `qrCode` (unique), `serialNumber?`, `purchaseDate?`
- `status DeviceStatus` (default: Working)
- `caseId String?` (optional FK to Case)
- `notes String?`
- Relations: DeviceImage[], DeviceDocument[], LogbookEntry[]

### New model: LogbookEntry

- `id`, `deviceId` (FK to Device, cascade delete), `date DateTime`
- `comment String`, `userId` (FK to User)

### New model: DeviceImage

- Same shape as Image but with `deviceId` instead of `caseId`

### New model: DeviceDocument

- Same shape as Document but with `deviceId` instead of `caseId`

### New model: Consumable

- `id`, `name`, `unit String`, `stockQuantity Float` (default 0), `notes String?`

---

## Phase 2 - Database: Group and Event Models [DONE]

Migration: `20260401000001_add_group_event`

### New enums

- `EventStatus`: Planned / Confirmed / Completed / Cancelled / NeedsDetails
- `InvoiceStatus`: Paid / NotPaid / DepositPaid / DepositNotYetPaid / NotPaidInFull

### New model: Group

- `id`, `name`
- Junction tables: GroupCase, GroupDevice, GroupItem, GroupConsumable
- GroupConsumable has `quantityNeeded Float`

### New model: Event

- `id`, `name`, `venueName`, `location?`, `startDate`, `endDate`
- `clientPhone?`, `clientEmail?`, `comments?`
- `status EventStatus` (default: Planned)
- `invoiceStatus InvoiceStatus` (default: NotPaid)
- Junction tables: EventStagehand (-> User), EventCase, EventDevice, EventItem, EventConsumable
- EventConsumable has `quantityNeeded Float`, `quantityUsed Float?`

---

## Phase 3 - UI: Inventory & Events Page Headers [DONE]

### Inventory page (`/editor`)

- Row 1: "Inventory" title + QR Generator button (existing)
- Row 2 (editors/admins only): "+ New Case", "+ New Item", "+ New Device", "+ New Consumable"

### Events page (`/events`)

- Row 1: "Events" title
- Row 2 (editors/admins only): "+ New Event", "Groups"

Buttons link to placeholder routes - forms implemented in later phases.

---

## Phase 4 - Device: Create / Edit / View [DONE]

Pages:

- `/devices/new` - create form (name, qrCode, serialNumber, purchaseDate, status, caseId, notes)
- `/devices/[id]` - detail view (info, photos, documents, logbook)
- `/devices/[id]/edit` - edit form

API routes:

- `POST /api/devices` - create
- `GET /api/devices/[id]` - fetch with relations
- `PATCH /api/devices/[id]` - update fields
- `DELETE /api/devices/[id]` - delete
- `POST /api/devices/[id]/logbook` - add logbook entry
- `DELETE /api/devices/[id]/logbook/[entryId]` - delete entry
- Photos and documents: reuse presigned URL flow, new endpoints under `/api/devices/[id]/images` and `/api/devices/[id]/documents`

Inventory list: show devices tab or merged list alongside cases.

---

## Phase 5 - Consumable: Create / Edit / List [DONE]

Pages:

- `/consumables` - list with stock levels
- `/consumables/new` - create form
- `/consumables/[id]/edit` - edit (including manual stock adjustment)

API routes:

- `POST /api/consumables`
- `GET /api/consumables`
- `PATCH /api/consumables/[id]`
- `DELETE /api/consumables/[id]`

---

## Phase 6 - Group: Create / Edit / List [DONE]

Pages:

- `/groups` - list all templates
- `/groups/new` - create form (name + add Cases/Devices/Items/Consumables)
- `/groups/[id]/edit` - edit

API routes:

- Full CRUD under `/api/groups`
- Add/remove members via `/api/groups/[id]/members`

---

## Phase 7 - Event: Create / Edit / View [DONE]

Pages:

- `/events` - list (already exists as placeholder)
- `/events/new` - create form (all Event fields + stagehands + inventory)
- `/events/[id]` - detail view (info, stagehands, inventory breakdown, consumable quantities)
- `/events/[id]/edit` - edit

API routes:

- Full CRUD under `/api/events`
- Add group to event: `POST /api/events/[id]/add-group` (expands group contents into event inventory)
- Consumable usage: `PATCH /api/events/[id]/consumables/[consumableId]` (set quantityUsed)
- On event completion: auto-decrement Consumable.stockQuantity by quantityUsed

---

## Phase 8 - Item: Standalone Items [DONE]

Currently items only exist inside cases. The new design allows standalone items.

Changes:

- Make `Item.caseId` nullable (migration)
- `/items` - list of standalone items
- `/items/new` - create standalone item
- `/items/[id]/edit` - edit standalone item
- Inventory list: show standalone items section

---

## Phase 9 - Audit Logging Extension [DONE]

Extend existing AuditLog to cover new entities:

- `DEVICE_CREATED`, `DEVICE_UPDATED`, `DEVICE_DELETED`
- `LOGBOOK_ENTRY_ADDED`
- `CONSUMABLE_CREATED`, `CONSUMABLE_UPDATED`, `CONSUMABLE_STOCK_ADJUSTED`
- `GROUP_CREATED`, `GROUP_UPDATED`, `GROUP_DELETED`
- `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_COMPLETED`
