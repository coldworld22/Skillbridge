    set $cors_allowed_origin "";
    set $allowed_origins_list "";
    if ($allowed_origins != "") {
      set $allowed_origins_list ",$allowed_origins,";
      if ($http_origin != "") {
        if ($allowed_origins_list ~ ",$http_origin,") {
          set $cors_allowed_origin $http_origin;
        }
      }
    }
