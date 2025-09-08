  set $allowed_origin "";
  if ($app_domain != "") {
    set $allowed_origin https://$app_domain;
  }

  location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Ensure a single Access-Control-Allow-Origin header
    proxy_hide_header Access-Control-Allow-Origin;
    if ($allowed_origin != "") {
      if ($http_origin = $allowed_origin) {
        add_header Access-Control-Allow-Origin $allowed_origin always;
      }
    }
    add_header Access-Control-Allow-Credentials true always;
  }

  # Serve Next.js static assets directly from the frontend service
  location ^~ /_next/static/ {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Ensure a single Access-Control-Allow-Origin header
    proxy_hide_header Access-Control-Allow-Origin;
    if ($allowed_origin != "") {
      if ($http_origin = $allowed_origin) {
        add_header Access-Control-Allow-Origin $allowed_origin always;
      }
    }
    add_header Access-Control-Allow-Credentials true always;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Forward Socket.IO traffic to backend and enable WebSocket upgrades
  location /socket.io/ {
    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Ensure a single Access-Control-Allow-Origin header
    proxy_hide_header Access-Control-Allow-Origin;
    if ($allowed_origin != "") {
      if ($http_origin = $allowed_origin) {
        add_header Access-Control-Allow-Origin $allowed_origin always;
      }
    }
    add_header Access-Control-Allow-Credentials true always;
  }

  location ^~ /api/ {
    # forward API requests without rewriting the path
    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    # Ensure a single Access-Control-Allow-Origin header
    proxy_hide_header Access-Control-Allow-Origin;
    if ($allowed_origin != "") {
      if ($http_origin = $allowed_origin) {
        add_header Access-Control-Allow-Origin $allowed_origin always;
      }
    }
    add_header Access-Control-Allow-Credentials true always;
  }
