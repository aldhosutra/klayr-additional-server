# Klayr.xyz Infra Setup: HAProxy & Nginx

This setup configures:

- **HAProxy** as a reverse proxy and load balancer for:

  - `totalsupply.klayr.xyz`
  - `circulatingsupply.klayr.xyz`
  - `cached-mainnet-service.klayr.xyz`
  - `cached-testnet-service.klayr.xyz`
  - `downloads.klayr.xyz`
  - `snapshots.klayr.xyz`
  - `service.klayr.xyz`

- **Nginx** as a static file server for:
  - `downloads.klayr.xyz`
  - `snapshots.klayr.xyz`

---

## 🧰 Requirements

- Ubuntu 20.04 or later
- Root or sudo access

---

## 🛠 Installation

### 1. Install HAProxy

```bash
sudo apt update
sudo apt install -y haproxy
```

### 2. Install Nginx

```bash
sudo apt install -y nginx
```

---

## ⚙️ Configuration

### 1. HAProxy

Replace the default HAProxy config with your custom one:

```bash
sudo cp ./haproxy.cfg /etc/haproxy/haproxy.cfg
sudo systemctl restart haproxy
sudo systemctl enable haproxy
```

#### What It Does:

- Listens on **port 80**
- Routes requests based on hostname using `acl` rules
- Performs HTTP health checks to `service.klayr.xyz/api/status`

---

### 2. Nginx

Add the static file configurations:

```bash
sudo cp ./nginx/downloads /etc/nginx/sites-available/downloads
sudo cp ./nginx/snapshots /etc/nginx/sites-available/snapshots

sudo ln -s /etc/nginx/sites-available/downloads /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/snapshots /etc/nginx/sites-enabled/
```

Create directories for static content:

```bash
sudo mkdir -p /var/www/downloads /var/www/snapshots
sudo chown -R www-data:www-data /var/www/downloads /var/www/snapshots
```

Restart Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
```

---

## 🌐 Domain & Routing

Make sure the following DNS records point to your server IP:

| Subdomain                          | Role                                     |
| ---------------------------------- | ---------------------------------------- |
| `totalsupply.klayr.xyz`            | Routed to internal app via HAProxy       |
| `circulatingsupply.klayr.xyz`      | Routed to internal app via HAProxy       |
| `cached-testnet-service.klayr.xyz` | Routed to internal app via HAProxy       |
| `cached-mainnet-service.klayr.xyz` | Routed to internal app via HAProxy       |
| `downloads.klayr.xyz`              | Routed to Nginx static files via HAProxy |
| `snapshots.klayr.xyz`              | Routed to Nginx static files via HAProxy |
| `service.klayr.xyz`                | Proxied to upstream node via HAProxy     |

---

## ✅ Notes

- HAProxy listens on **port 80** and handles all routing.
- Nginx listens only for internal traffic on custom ports and serves static files.
- HAProxy uses `acl` rules to route based on the hostname (SNI or Host header).
- Static file paths should be placed in:
  - `/var/www/downloads` for `downloads.klayr.xyz`
  - `/var/www/snapshots` for `snapshots.klayr.xyz`
- HAProxy performs health checks via `/api/status`.

```

```
