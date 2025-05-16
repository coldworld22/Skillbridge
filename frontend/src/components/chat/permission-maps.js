// permission-maps.js

export const ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    MEMBER: 'member',
  };
  
  export const PERMISSIONS = {
    [ROLES.ADMIN]: ['manage_members', 'edit_settings', 'delete_group'],
    [ROLES.MODERATOR]: ['manage_members', 'edit_settings'],
    [ROLES.MEMBER]: [],
  };
  