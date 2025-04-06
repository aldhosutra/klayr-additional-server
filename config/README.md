```
sudo cp ./nginx/downloads /etc/nginx/sites-available/downloads
sudo cp ./nginx/snapshots /etc/nginx/sites-available/snapshots
```

```
sudo ln -s /etc/nginx/sites-available/downloads /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/snapshots /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
