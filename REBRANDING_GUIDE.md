# White Labeling & Rebranding Guide for BloomSwiftPOS

This guide details the steps required to rebrand the BloomSwiftPOS system for new clients. Follow these steps to change the logo, colors, and business details across the application.

## 1. Application Name & Metadata

Update the application name and description in the following files:

### `package.json` (Root)

- **Field**: `productName`, `description`, `author`
- **Location**: Lines ~6-9, ~51
- **Action**: Change "BloomSwiftPOS" to your client's product name.

### `frontend/index.html`

- **Field**: `<title>`
- **Action**: Change the page title.

### `frontend/package.json`

- **Field**: `name` (optional, internal use)

## 2. Logos & Icons

Replace the following image files with your client's branding. Keep the filenames the same to avoid code changes, or update the references in the code.

### Locations:

- `Assets/BLOOM_SWIFT_POS_LOGO_XS_T.png` (App Icon)
- `Assets/logo.png` (Receipt Logo)
- `Assets/logo-512.png` (Large Icon)
- `frontend/public/BLOOM_SWIFT_POS_LOGO_XS_T.png`
- `frontend/public/logo.png`
- `frontend/public/wh_logo.png` (Login screen logo)
- `frontend/public/favicon.svg`

**Tip**: Ensure the new images have similar dimensions and transparency to the originals.

## 3. UI Colors & Styling

The application uses hardcoded color values in several components. You need to find and replace these hex codes.

**Primary Colors to Search & Replace:**

- `#134E8E` (Navy Blue - Main Sidebar & Header)
- `#808080` (Gray - Backgrounds)
- `#003366` (Hover State)

### Key Files to Edit:

#### `frontend/src/App.tsx`

- **Variable**: `bg`
- **Action**: Change `#808080` to the client's background color.

#### `frontend/src/components/Sidebar.tsx`

- **Variable**: `sidebarBg`
- **Action**: Change `#134E8E` to the client's primary brand color.
- **Variable**: `btnHoverGrad`
- **Action**: Update hover effect color if needed.

#### `frontend/src/pages/Login.tsx`

- **Variables**: `roseGold`, `gold`, `goldHover`
- **Inline Styles**: Look for `background: '#134E8E'` and `background: '#808080'`.
- **Text**: Change "Demo POS System" to the client's company name (Line ~52).

#### `frontend/src/components/Layout.tsx`

- **Text**: Change "Demo POS System" in the header (Line ~79).

#### `frontend/src/pages/Reports.tsx`

- **Variable**: `const SHOP_NAME` (Line ~13)
- **Action**: Update to client's name.

## 4. Receipt & WhatsApp Configuration

The backend and Electron services handle receipts and notifications with hardcoded details.

### `backend/src/utils/escposPrinter.ts` (Thermal Receipt)

1.  **Business Name**:
    - Find: `this.printer.println('Demo POS System');`
    - Replace with client name.

2.  **Address & Contact**:
    - Update the lines following the business name with the client's address and phone number.

3.  **Logo Path**:
    - **CRITICAL**: The code currently uses a hardcoded absolute path:
      `/home/gayan/Desktop/Project Files Weerasingha_Hardware_v4.0/...`
    - **Action**: Change this to a dynamic path using `path.join(__dirname, ...)` or a relative path that works on the client's machine.

### `backend/src/routes/print.ts` (PDF Receipt)

- **Business Name**: Find `.text('Demo POS System', ...)` (Line ~688) and replace it.

### `electron/services/whatsapp-native.js` (WhatsApp Messages)

- **Messages**: Find and replace "Demo POS System" in the invoice message template (Lines ~612, ~644).

## 5. Build & Distribution

After making changes, rebuild the application:

1.  **Frontend**: `cd frontend && npm run build`
2.  **Backend**: `cd backend && npx tsc`
3.  **Electron App**: `npm run electron:build` (or `electron:build:deb` / `electron:build:appimage` depending on target OS)

## Checklist

- [ ] Updated `package.json` metadata
- [ ] Replaced all logo files in `Assets/` and `frontend/public/`
- [ ] Updated colors in `Sidebar.tsx`, `Login.tsx`, and `App.tsx`
- [ ] Changed "Demo POS System" text in `Login.tsx` and `Reports.tsx`
- [ ] Updated receipt details in `escposPrinter.ts`
- [ ] Fixed absolute logo path in `escposPrinter.ts`
- [ ] Verified build successfully
