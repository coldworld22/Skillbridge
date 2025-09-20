    set $cors_allowed_origin "";
    if ($allowed_origins_list != "") {
      if ($http_origin != "") {
        if ($allowed_origins_list ~ ",$http_origin,") {
          set $cors_allowed_origin $http_origin;
        }
      }
    }
    if ($cors_allowed_origin != "") {
      add_header Access-Control-Allow-Origin $cors_allowed_origin always;
    }
    add_header Access-Control-Allow-Credentials true always;
