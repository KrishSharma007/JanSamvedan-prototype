import { PrismaClient, UserRole, ComplaintStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data
const users = [
  // Citizens
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    password: 'password123',
    phone: '+91-9876543210',
    address: '123 MG Road, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    password: 'password123',
    phone: '+91-9876543211',
    address: '456 Brigade Road, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Amit Patel',
    email: 'amit.patel@email.com',
    password: 'password123',
    phone: '+91-9876543212',
    address: '789 Koramangala, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reddy@email.com',
    password: 'password123',
    phone: '+91-9876543213',
    address: '321 Indiranagar, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    password: 'password123',
    phone: '+91-9876543214',
    address: '654 Whitefield, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Anita Desai',
    email: 'anita.desai@email.com',
    password: 'password123',
    phone: '+91-9876543215',
    address: '987 Electronic City, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Ravi Nair',
    email: 'ravi.nair@email.com',
    password: 'password123',
    phone: '+91-9876543216',
    address: '147 HSR Layout, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Kavya Iyer',
    email: 'kavya.iyer@email.com',
    password: 'password123',
    phone: '+91-9876543217',
    address: '258 Marathahalli, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Suresh Gupta',
    email: 'suresh.gupta@email.com',
    password: 'password123',
    phone: '+91-9876543218',
    address: '369 Banashankari, Bangalore',
    role: UserRole.CITIZEN,
  },
  {
    name: 'Meera Joshi',
    email: 'meera.joshi@email.com',
    password: 'password123',
    phone: '+91-9876543219',
    address: '741 Jayanagar, Bangalore',
    role: UserRole.CITIZEN,
  },

  // NGOs
  {
    name: 'Green Earth Foundation',
    email: 'contact@greenearth.org',
    password: 'password123',
    phone: '+91-9876543301',
    address: '456 Environmental Street, Bangalore',
    role: UserRole.NGO,
    organization: 'Green Earth Foundation',
    serviceArea: 'South Bangalore',
  },
  {
    name: 'Urban Development Trust',
    email: 'info@urbantrust.org',
    password: 'password123',
    phone: '+91-9876543302',
    address: '789 Civic Center, Bangalore',
    role: UserRole.NGO,
    organization: 'Urban Development Trust',
    serviceArea: 'Central Bangalore',
  },
  {
    name: 'Community Care Initiative',
    email: 'help@communitycare.org',
    password: 'password123',
    phone: '+91-9876543303',
    address: '321 Social Welfare Road, Bangalore',
    role: UserRole.NGO,
    organization: 'Community Care Initiative',
    serviceArea: 'North Bangalore',
  },
  {
    name: 'Public Service Alliance',
    email: 'support@psa.org',
    password: 'password123',
    phone: '+91-9876543304',
    address: '654 Service Lane, Bangalore',
    role: UserRole.NGO,
    organization: 'Public Service Alliance',
    serviceArea: 'East Bangalore',
  },
  {
    name: 'Civic Action Group',
    email: 'action@civicgroup.org',
    password: 'password123',
    phone: '+91-9876543305',
    address: '987 Action Street, Bangalore',
    role: UserRole.NGO,
    organization: 'Civic Action Group',
    serviceArea: 'West Bangalore',
  },

  // Admins
  {
    name: 'Admin User',
    email: 'admin@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543401',
    address: 'City Council Office, Bangalore',
    role: UserRole.ADMIN,
    department: 'Public Works',
  },
  {
    name: 'John Smith',
    email: 'john.smith@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543402',
    address: 'Municipal Office, Bangalore',
    role: UserRole.ADMIN,
    department: 'Sanitation',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@citycouncil.gov',
    password: 'admin123',
    phone: '+91-9876543403',
    address: 'City Hall, Bangalore',
    role: UserRole.ADMIN,
    department: 'Roads & Transport',
  },
];

const complaintCategories = [
  'Pothole',
  'Garbage Collection',
  'Street Light',
  'Water Supply',
  'Drainage',
  'Road Repair',
  'Traffic Signal',
  'Public Toilet',
  'Park Maintenance',
  'Electricity',
  'Sewage',
  'Footpath',
  'Bus Stop',
  'Traffic Sign',
  'Public Garden',
];

const priorities = ['low', 'medium', 'high'];

const statuses = [
  ComplaintStatus.PENDING,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.REJECTED,
];

const locations = [
  { name: 'MG Road', lat: 12.9716, lng: 77.5946 },
  { name: 'Brigade Road', lat: 12.9719, lng: 77.6062 },
  { name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { name: 'Indiranagar', lat: 12.9714, lng: 77.6412 },
  { name: 'Whitefield', lat: 12.9698, lng: 77.7500 },
  { name: 'Electronic City', lat: 12.8456, lng: 77.6603 },
  { name: 'HSR Layout', lat: 12.9115, lng: 77.6460 },
  { name: 'Marathahalli', lat: 12.9612, lng: 77.6972 },
  { name: 'Banashankari', lat: 12.9245, lng: 77.5615 },
  { name: 'Jayanagar', lat: 12.9245, lng: 77.5833 },
  { name: 'Malleshwaram', lat: 13.0067, lng: 77.5611 },
  { name: 'Basavanagudi', lat: 12.9434, lng: 77.5738 },
  { name: 'Rajajinagar', lat: 12.9915, lng: 77.5511 },
  { name: 'Vijayanagar', lat: 12.9815, lng: 77.5511 },
  { name: 'Chamrajpet', lat: 12.9615, lng: 77.5711 },
];

function generateComplaintId(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const t = String(now.getTime()).slice(-6);
  return `CR${y}${m}${d}${t}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  await prisma.complaintHelper.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Existing data cleared');

  // Create users
  console.log('👥 Creating users...');
  const createdUsers = [];
  for (const userData of users) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    const { password, ...userDataWithoutPassword } = userData;
    const user = await prisma.user.create({
      data: {
        ...userDataWithoutPassword,
        passwordHash,
      },
    });
    createdUsers.push(user);
  }
  console.log(`✅ Created ${createdUsers.length} users`);

  // Get citizen and NGO users for complaints
  const citizenUsers = createdUsers.filter(user => user.role === UserRole.CITIZEN);
  const ngoUsers = createdUsers.filter(user => user.role === UserRole.NGO);

  // Create complaints
  console.log('📝 Creating complaints...');
  const complaints = [];
  const numComplaints = 500; // Large dataset

  for (let i = 0; i < numComplaints; i++) {
    const citizen = getRandomElement(citizenUsers);
    const location = getRandomElement(locations);
    const category = getRandomElement(complaintCategories);
    const priority = getRandomElement(priorities);
    const status = getRandomElement(statuses);
    const createdAt = getRandomDate(
      new Date(2024, 0, 1), // Start of 2024
      new Date() // Now
    );

    const complaint = await prisma.complaint.create({
      data: {
        complaintId: generateComplaintId(),
        title: `${category} Issue in ${location.name}`,
        description: `Detailed description of the ${category.toLowerCase()} problem in ${location.name}. This issue has been affecting the local community and requires immediate attention from the concerned authorities.`,
        category,
        priority,
        status,
        latitude: location.lat + (Math.random() - 0.5) * 0.01, // Add some randomness
        longitude: location.lng + (Math.random() - 0.5) * 0.01,
        address: `${Math.floor(Math.random() * 999) + 1} ${location.name}, Bangalore`,
        imageUrl: Math.random() > 0.7 ? `https://picsum.photos/400/300?random=${i}` : null,
        reportedById: citizen.id,
        assignedDept: getRandomElement(['Public Works', 'Sanitation', 'Roads & Transport', 'Water Board', 'Electricity Board']),
        createdAt,
        updatedAt: getRandomDate(createdAt, new Date()),
      },
    });
    complaints.push(complaint);
  }
  console.log(`✅ Created ${complaints.length} complaints`);

  // Create helpers (NGOs helping with complaints)
  console.log('🤝 Creating helpers...');
  const helpers = [];
  const numHelpers = 800; // Many helping relationships

  for (let i = 0; i < numHelpers; i++) {
    const complaint = getRandomElement(complaints);
    const ngo = getRandomElement(ngoUsers);
    const status = getRandomElement(['HELPING', 'CONTACTED', 'DECLINED']);
    const createdAt = getRandomDate(
      complaint.createdAt,
      new Date()
    );

    // Check if this NGO is already helping with this complaint
    const existingHelper = await prisma.complaintHelper.findFirst({
      where: {
        complaintId: complaint.id,
        userId: ngo.id,
      },
    });

    if (!existingHelper) {
      const helper = await prisma.complaintHelper.create({
        data: {
          complaintId: complaint.id,
          userId: ngo.id,
          status,
          message: status === 'HELPING' ? `We are committed to helping resolve this ${complaint.category.toLowerCase()} issue in ${complaint.address}` : null,
          createdAt,
          updatedAt: getRandomDate(createdAt, new Date()),
        },
      });
      helpers.push(helper);
    }
  }
  console.log(`✅ Created ${helpers.length} helpers`);

  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`👥 Users: ${createdUsers.length}`);
  console.log(`   - Citizens: ${citizenUsers.length}`);
  console.log(`   - NGOs: ${ngoUsers.length}`);
  console.log(`   - Admins: ${createdUsers.filter(u => u.role === UserRole.ADMIN).length}`);
  console.log(`📝 Complaints: ${complaints.length}`);
  console.log(`🤝 Helpers: ${helpers.length}`);
  console.log(`📈 Average helpers per complaint: ${(helpers.length / complaints.length).toFixed(2)}`);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });