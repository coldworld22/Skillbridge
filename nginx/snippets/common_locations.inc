  # Determine if the request Origin is allowed based on a comma-separated
  # list supplied via the ALLOWED_ORIGINS environment variable.
  # Example: "https://foo.com,https://bar.com"
  set $cors_allowed_origin "";
  if ($allowed_origins != "") {
    set $allowed_origins_list ",$allowed_origins,";
    if ($http_origin != "") {
      if ($allowed_origins_list ~ ",$http_origin,") {
        set $cors_allowed_origin $http_origin;
      }
    }
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
    if ($cors_allowed_origin != "") {
      add_header Access-Control-Allow-Origin $cors_allowed_origin always;
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
    if ($cors_allowed_origin != "") {
      add_header Access-Control-Allow-Origin $cors_allowed_origin always;
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
    if ($cors_allowed_origin != "") {
      add_header Access-Control-Allow-Origin $cors_allowed_origin always;
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
    if ($cors_allowed_origin != "") {
      add_header Access-Control-Allow-Origin $cors_allowed_origin always;
    }
    add_header Access-Control-Allow-Credentials true always;
  }
  # Forward installer requests to the backend
  location ^~ /install/ {
    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /install {
    proxy_pass http://backend:5002/install/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Proxy uploaded files to the backend
  location ^~ /uploads/ {
    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
