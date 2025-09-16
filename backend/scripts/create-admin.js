#!/usr/bin/env node

const { z } = require('zod');
const bcrypt = require('bcrypt');
const db = require('../src/config/database');

const CredentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

async function ensureAdminRole(trx, now) {
  await trx('roles')
    .insert({
      name: 'Admin',
      description: 'Administrator with management privileges',
      created_at: now,
    })
    .onConflict('name')
    .ignore();

  return trx('roles').where({ name: 'Admin' }).first();
}

async function upsertAdminUser(trx, email, hashedPassword, now) {
  const existingUser = await trx('users')
    .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
    .first();

  if (existingUser) {
    await trx('users')
      .where({ id: existingUser.id })
      .update({
        password_hash: hashedPassword,
        role: 'Admin',
        status: 'active',
        is_email_verified: true,
        updated_at: now,
      });
    return existingUser.id;
  }

  const insertPayload = {
    full_name: 'Admin User',
    email,
    phone: null,
    password_hash: hashedPassword,
    role: 'Admin',
    avatar_url: null,
    is_online: false,
    status: 'active',
    profile_complete: false,
    is_email_verified: true,
    is_phone_verified: false,
    created_at: now,
    updated_at: now,
  };

  const inserted = await trx('users').insert(insertPayload).returning('id');
  const row = Array.isArray(inserted) ? inserted[0] : inserted;
  if (row && typeof row === 'object' && 'id' in row) {
    return row.id;
  }
  if (row) {
    return row;
  }
  const created = await trx('users')
    .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
    .first('id');
  if (!created) {
    throw new Error('Failed to determine created admin user id');
  }
  return created.id;
}

async function ensureAdminProfile(trx, userId, now) {
  const existingProfile = await trx('admin_profiles')
    .where({ user_id: userId })
    .first();

  const profileData = {
    job_title: 'Administrator',
    department: 'Management',
    updated_at: now,
  };

  if (existingProfile) {
    await trx('admin_profiles').where({ user_id: userId }).update(profileData);
    return;
  }

  await trx('admin_profiles').insert({
    user_id: userId,
    ...profileData,
    created_at: now,
  });
}

async function ensureRoleAssignment(trx, userId, roleId) {
  const existing = await trx('user_roles')
    .where({ user_id: userId, role_id: roleId })
    .first();
  if (!existing) {
    await trx('user_roles').insert({ user_id: userId, role_id: roleId });
  }
}

async function main() {
  const [emailArg, passwordArg] = process.argv.slice(2);
  const credentials = CredentialsSchema.parse({
    email: emailArg ?? process.env.ADMIN_EMAIL,
    password: passwordArg ?? process.env.ADMIN_PASSWORD,
  });

  const now = new Date();
  const hashedPassword = await bcrypt.hash(credentials.password, 12);

  await db.transaction(async (trx) => {
    const role = await ensureAdminRole(trx, now);
    if (!role) {
      throw new Error('Unable to locate Admin role');
    }
    const userId = await upsertAdminUser(trx, credentials.email, hashedPassword, now);
    await ensureAdminProfile(trx, userId, now);
    await ensureRoleAssignment(trx, userId, role.id ?? role);
  });

  console.log(`✅ Admin account provisioned for ${credentials.email}`);
}

main()
  .catch((err) => {
    console.error('Failed to provision admin account:', err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
