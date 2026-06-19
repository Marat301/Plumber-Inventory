# Inventory App

A mobile-friendly inventory tracker with QR/barcode scanning, multiple lists, and light/dark mode.

## Features

- **Login screen** — password-protected access (default password: `inventory`)
- **Barcode/QR scanning** — use your phone camera to add materials
- **Multiple lists** — Warehouse, Truck 1, Truck 2, Job Site, plus custom lists
- **Material details** — name, material type (copper, PVC, etc.), and length
- **Filter & Sort** — buttons in place for future implementation
- **Light/Dark mode** — toggle in Settings

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal. On your phone, use the same Wi‑Fi network and visit your computer's local IP (e.g. `http://192.168.1.x:5173`).

## Usage

1. Log in with password `inventory` (change it in Settings)
2. Select a list (Warehouse, Truck, Job Site, etc.)
3. Tap the camera button to scan barcodes/QR codes
4. Tap an item to edit material type and length

## Tech Stack

- React + TypeScript + Vite
- html5-qrcode for camera scanning
- Local storage for data persistence
