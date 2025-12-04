require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, Category, KostType, Facility, Kost, KostImage } = require('../models');
const { sequelize } = require('../config/database');

const createDummyData = async () => {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Create dummy users (penyewa and pemilik)
    console.log('👥 Creating dummy users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.bulkCreate([
      {
        name: 'Ahmad Penyewa',
        email: 'ahmad@example.com',
        password: hashedPassword,
        phone: '081234567891',
        role: 'penyewa',
        email_verified: true,
        phone_verified: true
      },
      {
        name: 'Budi Penyewa',
        email: 'budi@example.com',
        password: hashedPassword,
        phone: '081234567892',
        role: 'penyewa',
        email_verified: true,
        phone_verified: true
      },
      {
        name: 'Citra Penyewa',
        email: 'citra@example.com',
        password: hashedPassword,
        phone: '081234567893',
        role: 'penyewa',
        email_verified: false,
        phone_verified: false
      },
      {
        name: 'Dewi Pemilik',
        email: 'dewi@example.com',
        password: hashedPassword,
        phone: '081234567894',
        role: 'pemilik',
        email_verified: true,
        phone_verified: true
      },
      {
        name: 'Eko Pemilik',
        email: 'eko@example.com',
        password: hashedPassword,
        phone: '081234567895',
        role: 'pemilik',
        email_verified: true,
        phone_verified: true
      }
    ]);
    console.log(`✅ Created ${users.length} users\n`);

    // 2. Create categories
    console.log('📁 Creating categories...');
    const categories = await Category.bulkCreate([
      {
        name: 'Kost Putra',
        slug: 'kost-putra',
        description: 'Kost khusus untuk pria'
      },
      {
        name: 'Kost Putri',
        slug: 'kost-putri',
        description: 'Kost khusus untuk wanita'
      },
      {
        name: 'Kost Campur',
        slug: 'kost-campur',
        description: 'Kost untuk pria dan wanita'
      }
    ]);
    console.log(`✅ Created ${categories.length} categories\n`);

    // 3. Create kost types
    console.log('🏠 Creating kost types...');
    const kostTypes = await KostType.bulkCreate([
      {
        name: 'Harian',
        slug: 'harian',
        description: 'Pembayaran per hari'
      },
      {
        name: 'Mingguan',
        slug: 'mingguan',
        description: 'Pembayaran per minggu'
      },
      {
        name: 'Bulanan',
        slug: 'bulanan',
        description: 'Pembayaran per bulan'
      },
      {
        name: 'Tahunan',
        slug: 'tahunan',
        description: 'Pembayaran per tahun'
      }
    ]);
    console.log(`✅ Created ${kostTypes.length} kost types\n`);

    // 4. Create facilities
    console.log('⚡ Creating facilities...');
    const facilities = await Facility.bulkCreate([
      {
        name: 'WiFi',
        slug: 'wifi',
        icon: '📶',
        description: 'Internet WiFi gratis'
      },
      {
        name: 'AC',
        slug: 'ac',
        icon: '❄️',
        description: 'Air Conditioner'
      },
      {
        name: 'Kamar Mandi Dalam',
        slug: 'kamar-mandi-dalam',
        icon: '🚿',
        description: 'Kamar mandi di dalam kamar'
      },
      {
        name: 'Parkir Motor',
        slug: 'parkir-motor',
        icon: '🏍️',
        description: 'Area parkir motor'
      },
      {
        name: 'Parkir Mobil',
        slug: 'parkir-mobil',
        icon: '🚗',
        description: 'Area parkir mobil'
      },
      {
        name: 'Dapur',
        slug: 'dapur',
        icon: '🍳',
        description: 'Dapur bersama'
      },
      {
        name: 'Laundry',
        slug: 'laundry',
        icon: '🧺',
        description: 'Layanan laundry'
      },
      {
        name: 'Kasur',
        slug: 'kasur',
        icon: '🛏️',
        description: 'Kasur dan tempat tidur'
      },
      {
        name: 'Lemari',
        slug: 'lemari',
        icon: '🚪',
        description: 'Lemari pakaian'
      },
      {
        name: 'Meja Belajar',
        slug: 'meja-belajar',
        icon: '📚',
        description: 'Meja dan kursi belajar'
      }
    ]);
    console.log(`✅ Created ${facilities.length} facilities\n`);

    // 5. Create kosts (some approved, some pending)
    console.log('🏘️ Creating kosts...');
    const pemilikDewi = users.find(u => u.email === 'dewi@example.com');
    const pemilikEko = users.find(u => u.email === 'eko@example.com');

    const kosts = await Kost.bulkCreate([
      {
        owner_id: pemilikDewi.id,
        category_id: categories[1].id, // Kost Putri
        kost_type_id: kostTypes[2].id, // Bulanan
        name: 'Kost Putri Mawar',
        slug: 'kost-putri-mawar',
        description: 'Kost putri nyaman dekat kampus UNHAS. Fasilitas lengkap dan aman.',
        address: 'Jl. Perintis Kemerdekaan No. 10',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        postal_code: '90245',
        latitude: '-5.135399',
        longitude: '119.423790',
        price: 1200000,
        available_rooms: 5,
        total_rooms: 10,
        is_approved: true,
        rules: 'Jam malam 22.00, Dilarang membawa tamu lawan jenis, Wajib jaga kebersihan'
      },
      {
        owner_id: pemilikDewi.id,
        category_id: categories[1].id, // Kost Putri
        kost_type_id: kostTypes[2].id, // Bulanan
        name: 'Kost Putri Melati',
        slug: 'kost-putri-melati',
        description: 'Kost putri eksklusif dengan fasilitas premium.',
        address: 'Jl. AP Pettarani No. 25',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        postal_code: '90222',
        latitude: '-5.147665',
        longitude: '119.432731',
        price: 1500000,
        available_rooms: 3,
        total_rooms: 8,
        is_approved: false,
        rules: 'Jam malam 23.00, Dilarang membawa tamu, AC 24 jam'
      },
      {
        owner_id: pemilikEko.id,
        category_id: categories[0].id, // Kost Putra
        kost_type_id: kostTypes[2].id, // Bulanan
        name: 'Kost Putra Flamboyan',
        slug: 'kost-putra-flamboyan',
        description: 'Kost putra strategis dekat Mall Panakkukang.',
        address: 'Jl. Boulevard No. 15',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        postal_code: '90231',
        latitude: '-5.148920',
        longitude: '119.422371',
        price: 1000000,
        available_rooms: 8,
        total_rooms: 12,
        is_approved: true,
        rules: 'Bebas jam malam, Parkir luas, Dilarang membuat keributan'
      },
      {
        owner_id: pemilikEko.id,
        category_id: categories[2].id, // Kost Campur
        kost_type_id: kostTypes[2].id, // Bulanan
        name: 'Kost Campur Anggrek',
        slug: 'kost-campur-anggrek',
        description: 'Kost campur dengan fasilitas modern.',
        address: 'Jl. Hertasning No. 88',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        postal_code: '90222',
        latitude: '-5.173450',
        longitude: '119.461609',
        price: 900000,
        available_rooms: 0,
        total_rooms: 15,
        is_approved: true,
        rules: 'Lantai terpisah putra-putri, WiFi gratis, Laundry tersedia'
      },
      {
        owner_id: pemilikEko.id,
        category_id: categories[0].id, // Kost Putra
        kost_type_id: kostTypes[0].id, // Harian
        name: 'Kost Harian Mahasiswa',
        slug: 'kost-harian-mahasiswa',
        description: 'Kost harian cocok untuk mahasiswa atau pekerja.',
        address: 'Jl. Toddopuli No. 45',
        city: 'Makassar',
        province: 'Sulawesi Selatan',
        postal_code: '90224',
        latitude: '-5.176543',
        longitude: '119.464221',
        price: 75000,
        available_rooms: 10,
        total_rooms: 10,
        is_approved: false,
        rules: 'Check-in 14.00, Check-out 12.00, Deposit Rp 100.000'
      }
    ]);
    console.log(`✅ Created ${kosts.length} kosts\n`);

    // 6. Add images to approved kosts
    console.log('🖼️ Creating kost images...');
    const approvedKosts = kosts.filter(k => k.is_approved);
    
    for (const kost of approvedKosts) {
      await KostImage.bulkCreate([
        {
          kost_id: kost.id,
          image_url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(kost.name)}+1`,
          is_primary: true
        },
        {
          kost_id: kost.id,
          image_url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(kost.name)}+2`,
          is_primary: false
        },
        {
          kost_id: kost.id,
          image_url: `https://via.placeholder.com/800x600?text=${encodeURIComponent(kost.name)}+3`,
          is_primary: false
        }
      ]);
    }
    console.log(`✅ Created images for ${approvedKosts.length} approved kosts\n`);

    // Summary
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════════');
    console.log(`👥 Users: ${users.length} (3 penyewa, 2 pemilik)`);
    console.log(`📁 Categories: ${categories.length}`);
    console.log(`🏠 Kost Types: ${kostTypes.length}`);
    console.log(`⚡ Facilities: ${facilities.length}`);
    console.log(`🏘️ Kosts: ${kosts.length} (3 approved, 2 pending)`);
    console.log('═══════════════════════════════════════════\n');

    console.log('✅ Dummy data created successfully!\n');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('─────────────────────────────────────────');
    console.log('Admin:');
    console.log('  Email: admin@kostku.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Penyewa (Verified):');
    console.log('  Email: ahmad@example.com / budi@example.com');
    console.log('  Password: password123');
    console.log('');
    console.log('Penyewa (Unverified):');
    console.log('  Email: citra@example.com');
    console.log('  Password: password123');
    console.log('');
    console.log('Pemilik:');
    console.log('  Email: dewi@example.com / eko@example.com');
    console.log('  Password: password123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    process.exit(1);
  }
};

createDummyData();
