    proxy_hide_header Access-Control-Allow-Origin;
    set $cors_allowed_origin "";
    set $normalized_origin "__no_origin__";
    set $origin_match "";

    if ($http_origin != "") {
        set $normalized_origin ",$http_origin,";
    }

    if ($allowed_origins_list != "") {
        set $origin_match $allowed_origins_list;
    }

    if ($origin_match ~ $normalized_origin) {
        set $cors_allowed_origin $http_origin;
    }

    if ($cors_allowed_origin != "") {
        add_header Access-Control-Allow-Origin $cors_allowed_origin always;
    }

    add_header Access-Control-Allow-Credentials true always;
