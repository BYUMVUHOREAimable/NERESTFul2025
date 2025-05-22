// prisma/seed.js
const { PrismaClient, RoleName } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { Prisma } = require('@prisma/client'); // For Prisma.Decimal
const prisma = new PrismaClient();

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('Start seeding parking attendant system (v2)...');

  // Clear existing data in order (Log model removed)
  // await prisma.log.deleteMany({}); // REMOVED
  await prisma.vehicleEntry.deleteMany({});
  await prisma.parking.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  console.log('Cleared existing data.');

  // --- Create Roles ---
  const adminRole = await prisma.role.create({
    data: { name: RoleName.ADMIN, description: 'System Administrator' },
  });
  const attendantRole = await prisma.role.create({
    data: { name: RoleName.PARKING_ATTENDANT, description: 'Parking Gate Attendant' },
  });
  console.log('Roles created.');

  // --- Create Permissions --- (These are more staff-focused now)
  const permissionsData = [
    { name: 'manage_users', description: 'Can manage system users (admins, attendants)' },
    { name: 'manage_roles_permissions', description: 'Can manage roles and permissions' },
    { name: 'manage_parkings', description: 'Can manage parking facilities/zones' },
    { name: 'view_all_vehicle_entries', description: 'Can view all vehicle entry records' },
    { name: 'view_system_reports', description: 'Can view reports' },
    // { name: 'view_audit_logs', description: 'Can view system audit logs' }, // REMOVED as Log model is removed
    { name: 'record_vehicle_entry', description: 'Can record vehicle entry' },
    { name: 'record_vehicle_exit', description: 'Can record vehicle exit' },
    { name: 'view_current_parked_vehicles', description: 'Can view currently parked vehicles' },
    { name: 'generate_entry_ticket', description: 'Can generate entry PDF ticket' },
    { name: 'generate_exit_bill', description: 'Can generate exit PDF bill' },
    { name: "manage_own_profile", description: "Can update own staff profile" },
    { name: 'list_selectable_parkings', description: 'Can list parking facilities for selection during vehicle entry' },
    { name: 'view_all_parkings_details', description: 'Can view detailed list of all parking facilities' },

  ];
  const createdPermissions = await Promise.all(
    permissionsData.map(permData => prisma.permission.create({ data: permData }))
  );
  console.log('Permissions created.');

  // --- Assign Permissions to Roles ---
  // Admin gets all permissions
  for (const permission of createdPermissions) {
    await prisma.rolePermission.create({
      data: { role_id: adminRole.id, permission_id: permission.id },
    });
  }

  const attendantPermNames = [
    'record_vehicle_entry', 'record_vehicle_exit', 'view_current_parked_vehicles',
    'generate_entry_ticket', 'generate_exit_bill', 'manage_own_profile',
    'list_selectable_parkings',
    'view_all_parkings_details',
  ];
  for (const permName of attendantPermNames) {
    const permission = createdPermissions.find(p => p.name === permName);
    if (permission) {
      await prisma.rolePermission.create({
        data: { role_id: attendantRole.id, permission_id: permission.id },
      });
    }
  }
  console.log('RolePermissions created.');

  // --- Create Default Users ---
  // For seeded staff, we can set email_verified to true to bypass verification for these initial accounts.
  // New staff created via UI would go through verification.
  const adminPassword = await hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || 'adminpass123');
  await prisma.user.create({
    data: {
      firstName: 'Super',
      lastName: 'Admin',
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@XYZ LTD PMS.com',
      password: adminPassword,
      role_id: adminRole.id,
      email_verified: true, // Seeded admin is verified
      // email_verification_code: null, // Not needed if verified
    },
  });
  console.log('Default admin user created.');

  const attendantPassword = await hashPassword(process.env.ATTENDANT_DEFAULT_PASSWORD || 'attendpass123');
  await prisma.user.create({
    data: {
      firstName: 'Gate',
      lastName: 'Attendant1',
      email: process.env.ATTENDANT_DEFAULT_EMAIL || 'attendant1@XYZ LTD PMS.com',
      password: attendantPassword,
      role_id: attendantRole.id,
      email_verified: true, // Seeded attendant is verified
      // email_verification_code: null, // Not needed if verified
    },
  });
  console.log('Default parking attendant user created.');

  // --- Create Sample Parking Facilities/Zones ---
  // (This part remains the same as the previous seed version where all slots had a cost)
  const parkingsData = [
    { code: 'P1', name: 'Main Ground Parking', total_spaces: 100, location: 'Near Gate 1', charge_per_hour: new Prisma.Decimal('3.00') },
    { code: 'UG', name: 'Underground Level A', total_spaces: 75, location: 'Basement Level 1', charge_per_hour: new Prisma.Decimal('3.50') },
    { code: 'VIP', name: 'VIP Section', total_spaces: 20, location: 'North Wing, Reserved', charge_per_hour: new Prisma.Decimal('7.00') },
  ];
  for (const parkingData of parkingsData) {
    await prisma.parking.create({ data: parkingData });
  }
  console.log(`Created ${parkingsData.length} sample parking facilities.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });