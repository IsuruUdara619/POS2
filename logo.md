## Logo guide

This project uses three main logo images in the frontend:

- Background watermark logo: shown behind all pages
- Top bar company logo: shown in the top bar of every page
- Sidebar logo: shown at the top of the left sidebar

All logo images are standard static files served from the frontend `public` folder.

### 1. Where the logo files are

Frontend path (code):

- Background logo (watermark)
  - File: `frontend/public/logo.png`
  - Used in: `src/components/Layout.tsx` as the page background
- Company logo (top bar and login screen)
  - File: `frontend/public/wh_logo.png`
  - Used in:
    - `src/components/Layout.tsx`
    - `src/pages/Login.tsx`
- Sidebar logo
  - File: `frontend/public/BLOOM_SWIFT_POS_LOGO_XS_T.png`
  - Used in: `src/components/Sidebar.tsx`

In the browser (runtime), these files are referenced as:

- `/logo.png`
- `/wh_logo.png`
- `/BLOOM_SWIFT_POS_LOGO_XS_T.png`

### 2. How to change a logo image (recommended way)

This is the simplest way: keep the same file names and only replace the image contents.

1. Prepare your new logo image as a `.png` file.
2. Go to the folder: `frontend/public/`
3. Replace the existing image file with your own:
   - To change the background watermark, replace `logo.png`
   - To change the top bar and login logo, replace `wh_logo.png`
   - To change the sidebar logo, replace `BLOOM_SWIFT_POS_LOGO_XS_T.png`
4. Keep the same file names and extension (`.png`).
5. Restart the frontend dev server if it is running, then refresh the browser (hard refresh is best: `Ctrl + F5`).

That is enough for most cases; no code changes are required if you keep the same file names.

### 3. How to change logo file names in code (optional)

If you want to use different file names instead of the existing ones:

1. Copy your new images into `frontend/public/`, for example:
   - `my_background_logo.png`
   - `my_company_logo.png`
   - `my_sidebar_logo.png`
2. Update the imports in the React components.

Files to edit:

- Background and top bar logo:
  - `frontend/src/components/Layout.tsx`
  - Change:
    - `import backgroundLogo from '/logo.png';`
    - `import companyLogo from '/wh_logo.png';`
  - To point to your new files, for example:
    - `import backgroundLogo from '/my_background_logo.png';`
    - `import companyLogo from '/my_company_logo.png';`

- Sidebar logo:
  - `frontend/src/components/Sidebar.tsx`
  - Change:
    - `import logoImage from '/BLOOM_SWIFT_POS_LOGO_XS_T.png';`
  - To, for example:
    - `import logoImage from '/my_sidebar_logo.png';`

- Login page logo:
  - `frontend/src/pages/Login.tsx`
  - Change:
    - `import companyLogo from '/wh_logo.png';`
  - To, for example:
    - `import companyLogo from '/my_company_logo.png';`

After these edits, restart the frontend and refresh the browser.

### 4. How to remove a logo from the UI

If you do not want to show some or all logos in the system, you can safely remove the corresponding elements from the JSX.

#### 4.1 Remove the background watermark logo

File: `frontend/src/components/Layout.tsx`

- Find the block that creates the background image layer:

```tsx
<div style={{
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundImage: `url(${backgroundLogo})`,
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  opacity: 0.5,
  zIndex: 0,
  pointerEvents: 'none'
}} />
```

- Remove this entire `<div ... />` block from the component.
- Optionally also remove the import line:
  - `import backgroundLogo from '/logo.png';`

This will remove the big background logo from all pages that use `Layout`.

#### 4.2 Remove the top bar logo

File: `frontend/src/components/Layout.tsx`

- Find the `<img>` tag inside the top bar:

```tsx
<img src={companyLogo} alt="WH" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8, background: '#fff', padding: 4 }} />
```

- Delete that `<img ... />` line.
- Optionally remove the `companyLogo` import if it is no longer used in this file.

#### 4.3 Remove the sidebar logo

File: `frontend/src/components/Sidebar.tsx`

- At the top, you will see:
  - `import logoImage from '/BLOOM_SWIFT_POS_LOGO_XS_T.png';`
- Near the top of the sidebar JSX you will see a `<img src={logoImage} ... />` (or similar).
- Remove:
  - The `<img ... />` element from the JSX.
  - The `logoImage` import line if it is no longer used.

#### 4.4 Remove the login page logo

File: `frontend/src/pages/Login.tsx`

- At the top, you will see:
  - `import companyLogo from '/wh_logo.png';`
- In the JSX, remove the `<img src={companyLogo} ... />` element that appears in the login header.
- Remove the `companyLogo` import if it is not used anywhere else in the file.

### 5. Tips for best results

- Use PNG with transparent background for cleaner visuals.
- Use square or nearly square images (for the top bar and sidebar) so they look good with the existing `height` and `width` styles.
- If the logo looks too big or too small, adjust:
  - The `height` and `width` values in the `<img>` styles.
  - The `backgroundSize` value in the background watermark section (for example, change `contain` to `50%` or `cover`).

With these steps you can change, remove, or fully rebrand all logos used in the system.

