# LAN & Wi-Fi Access Guide

This document explains how to access the Venture Chess Academy (VCA) platform from other devices (laptops, tablets, phones) on the same Wi-Fi network.

## 1. Network Configuration

The application is configured to listen on all network interfaces (`0.0.0.0`). To access it from another device, you need the **Host IP Address** of the machine running the servers.

### How to find your Host IP:
1. Open a terminal on the host machine.
2. Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux).
3. Look for `IPv4 Address` under your Wi-Fi adapter (e.g., `192.168.1.105`).

## 2. Server Setup

Ensure all servers are running on the host machine:

```bash
# In separate terminals or using a monorepo runner:
cd apps/api && npm run dev
cd apps/realtime && npm run dev
cd apps/web && npm run dev -- --hostname 0.0.0.0
```

The terminals will log the network URLs:
- **Web**: `http://<your-ip>:3000`
- **API**: `http://<your-ip>:4000`
- **Realtime**: `ws://<your-ip>:4001`

## 3. Environment Variables

The apps are configured via `.env` files. If your Host IP changes, update the following:

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://<your-ip>:4000
NEXT_PUBLIC_SOCKET_URL=http://<your-ip>:4001
```

### `apps/api/.env`
```env
ALLOWED_ORIGINS=http://localhost:3000,http://<your-ip>:3000
```

## 4. Troubleshooting

- **Firewall**: Ensure ports `3000`, `4000`, and `4001` are open in your Windows/OS firewall.
- **Same Network**: Both devices MUST be on the same Wi-Fi or connected to the same router.
- **CORS Errors**: If you see CORS errors in the browser console, double-check that `ALLOWED_ORIGINS` in the API includes the IP you are using in the address bar.
- **Socket Connection**: If the chess board says "Offline", verify that `NEXT_PUBLIC_SOCKET_URL` is correct and that the Realtime server is running.
