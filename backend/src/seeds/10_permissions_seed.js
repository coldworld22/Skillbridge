exports.seed = async function (knex) {
  const permissions = [
    { code: 'view_course', description: 'Permission to view courses' },
    { code: 'view_languages', description: 'Permission to view languages' },
    { code: 'manage_languages', description: 'Permission to manage languages' },
    { code: 'view_language_config', description: 'Permission to view language configuration' },
    { code: 'manage_language_config', description: 'Permission to manage language configuration' },
    { code: 'view_currencies', description: 'Permission to view currencies' },
    { code: 'manage_currencies', description: 'Permission to manage currencies' },
    { code: 'view_social_logins', description: 'Permission to view social login settings' },
    { code: 'manage_social_logins', description: 'Permission to manage social login settings' },
    { code: 'view_email_config', description: 'Permission to view email configuration' },
    { code: 'manage_email_config', description: 'Permission to manage email configuration' },
    { code: 'view_messages_config', description: 'Permission to view messages configuration' },
    { code: 'manage_messages_config', description: 'Permission to manage messages configuration' },
    { code: 'view_policies', description: 'Permission to view policies' },
    { code: 'manage_policies', description: 'Permission to manage policies' },
    { code: 'view_contact_info', description: 'Permission to view contact information' },
    { code: 'manage_contact_info', description: 'Permission to manage contact information' },
    { code: 'view_blogs', description: 'Permission to view blogs' },
    { code: 'manage_blogs', description: 'Permission to manage blogs' },
    { code: 'view_faqs', description: 'Permission to view FAQs' },
    { code: 'manage_faqs', description: 'Permission to manage FAQs' },
    { code: 'view_app_settings', description: 'Permission to view application settings' },
    { code: 'manage_app_settings', description: 'Permission to manage application settings' },
    { code: 'view_footer_settings', description: 'Permission to view footer settings' },
    { code: 'manage_footer_settings', description: 'Permission to manage footer settings' },
    { code: 'view_seo_settings', description: 'Permission to view SEO settings' },
    { code: 'manage_seo_settings', description: 'Permission to manage SEO settings' },
    { code: 'view_popups', description: 'Permission to view popups and alerts' },
    { code: 'manage_popups', description: 'Permission to manage popups and alerts' },
    { code: 'view_certificate_templates', description: 'Permission to view certificate templates' },
    { code: 'manage_certificate_templates', description: 'Permission to manage certificate templates' },
    { code: 'view_third_party_config', description: 'Permission to view third-party configuration' },
    { code: 'manage_third_party_config', description: 'Permission to manage third-party configuration' },
    { code: 'view_online_classes', description: 'Permission to view online classes' },
    { code: 'manage_online_classes', description: 'Permission to manage online classes' },
    {
      code: 'ADD_ONLINE_CLASS_RULE',
      description: 'Permission to add or manage online class rules',
    },
    { code: 'view_roles', description: 'Permission to view roles' },
    { code: 'manage_roles', description: 'Permission to create and update roles' },
    { code: 'view_permissions', description: 'Permission to view permissions' },
    { code: 'manage_permissions', description: 'Permission to create and update permissions' },
  ];

  await knex('permissions')
    .insert(permissions)
    .onConflict('code')
    .ignore();
};
