    proxy_hide_header Access-Control-Allow-Origin;
    set $cors_allowed_origin "";
    if ($allowed_origins != "") {
        set $allowed_origins_list ",$allowed_origins,";
        if ($http_origin != "") {
            set $normalized_origin ",$http_origin,";
            if ($allowed_origins_list ~ $normalized_origin) {
                set $cors_allowed_origin $http_origin;
            }
        }
    }
    if ($cors_allowed_origin != "") {
        add_header Access-Control-Allow-Origin $cors_allowed_origin always;
    }
    add_header Access-Control-Allow-Credentials true always;
