const mongoose = require('mongoose');
const Concession = require('./models/Concession.model');
const connectDB = require('./config/database');

const newImageUrls = {
  'Bắp rang bơ size L': 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&q=80&w=400',
  'Bắp rang bơ size M': 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?auto=format&fit=crop&q=80&w=400',
  'Hotdog Xúc Xích Đức': 'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&q=80&w=400',
  'Nachos Phô Mai': 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?auto=format&fit=crop&q=80&w=400',
  'Gà Cay Nova': 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&q=80&w=400',
  'Coca-Cola size L': 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400',
  'Pepsi size L': 'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Nước suối Lavie': 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&q=80&w=400',
  'Trà sữa trân châu': 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&q=80&w=400',
  'Combo Đôi Classic': 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=400',
  'Combo Gia Đình': 'https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=400',
  'Combo Cặp Đôi VIP': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400'
};

const updateImages = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Updating concession images...');
    let updatedCount = 0;
    
    for (const [name, imageUrl] of Object.entries(newImageUrls)) {
      const result = await Concession.updateMany({ name: name }, { imageUrl: imageUrl });
      console.log(`- Updated ${result.modifiedCount} items named "${name}"`);
      updatedCount += result.modifiedCount;
    }

    console.log(`Successfully updated ${updatedCount} concession images in the database!`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to update concession images:', error.message);
    process.exit(1);
  }
};

updateImages();
