  location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    include /etc/nginx/snippets/cors.inc;
  }

  # Serve Next.js static assets directly from the frontend service
  location ^~ /_next/static/ {
    set $cors_allowed_origin "";
    if ($allowed_origins != "") {
      set $allowed_origins_list ",$allowed_origins,";
      if ($http_origin != "") {
        if ($allowed_origins_list ~ ",$http_origin,") {
          set $cors_allowed_origin $http_origin;
        }
      }
    }

    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    include /etc/nginx/snippets/cors.inc;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
  }

  # Forward Socket.IO traffic to backend and enable WebSocket upgrades
  location /socket.io/ {
    set $cors_allowed_origin "";
    if ($allowed_origins != "") {
      set $allowed_origins_list ",$allowed_origins,";
      if ($http_origin != "") {
        if ($allowed_origins_list ~ ",$http_origin,") {
          set $cors_allowed_origin $http_origin;
        }
      }
    }


    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    include /etc/nginx/snippets/cors.inc;
  }

  location ^~ /api/ {
    set $cors_allowed_origin "";
    if ($allowed_origins != "") {
      set $allowed_origins_list ",$allowed_origins,";
      if ($http_origin != "") {
        if ($allowed_origins_list ~ ",$http_origin,") {
          set $cors_allowed_origin $http_origin;
        }
      }
    }

    # forward API requests without rewriting the path
    proxy_pass http://backend:5002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    include /etc/nginx/snippets/cors.inc;
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
