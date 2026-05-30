require("dotenv").config();
const mongoose = require("mongoose");
const Movie = require("./models/Movie.model");
const Theater = require("./models/Theater.model");
const Room = require("./models/Room.model");
const User = require("./models/User.model");

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/movie-ticket-booking",
    );
    console.log("Connected!");

    console.log("Clearing old data...");
    await Promise.all([
      Movie.deleteMany({}),
      Theater.deleteMany({}),
      Room.deleteMany({}),
      User.deleteMany({ email: "admin@nova.com" }),
    ]);

    console.log("Creating Admin User...");
    // Create an admin user
    await User.create({
      username: "Admin Nova",
      email: "admin@nova.com",
      password: "password123", // Will be hashed by pre-save hook in model
      role: "admin",
      phone: "0123456789",
    });

    console.log("Creating Movies...");
    const movies = await Movie.insertMany([
      {
        title: "Dune: Part Two",
        description:
          "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        duration: 166,
        releaseDate: new Date("2024-03-01"),
        genre: ["Sci-Fi", "Adventure", "Action"],
        language: "English",
        director: "Denis Villeneuve",
        cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
        posterUrl:
          "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2JGqqUT1O.jpg",
        trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w",
        rating: "PG-13",
        status: "now-showing",
      },
      {
        title: "Godzilla x Kong: The New Empire",
        description:
          "Two ancient titans, Godzilla and Kong, clash in an epic battle as humans unravel their intertwined origins and connection to Skulls Island's mysteries.",
        duration: 115,
        releaseDate: new Date("2024-03-29"),
        genre: ["Action", "Sci-Fi", "Adventure"],
        language: "English",
        director: "Adam Wingard",
        cast: ["Rebecca Hall", "Brian Tyree Henry", "Dan Stevens"],
        posterUrl:
          "https://image.tmdb.org/t/p/original/tMefBSflR6PGQLvLuPEHZot4pC.jpg",
        trailerUrl: "https://www.youtube.com/embed/lV1OOlGwExM",
        rating: "PG-13",
        status: "now-showing",
      },
      {
        title: "Kung Fu Panda 4",
        description:
          "After Po is tapped to become the Spiritual Leader of the Valley of Peace, he needs to find and train a new Dragon Warrior.",
        duration: 94,
        releaseDate: new Date("2024-03-08"),
        genre: ["Animation", "Action", "Comedy"],
        language: "English",
        director: "Mike Mitchell",
        cast: ["Jack Black", "Awkwafina", "Viola Davis"],
        posterUrl:
          "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        trailerUrl: "https://www.youtube.com/embed/_inKs4eeHiI",
        rating: "PG",
        status: "coming-soon",
      },
    ]);

    console.log("Creating Theaters...");
    const theater1 = await Theater.create({
      name: "Nova Cinema HCMC",
      location: "District 1, Ho Chi Minh City",
      address: "123 Le Loi, District 1",
      city: "Ho Chi Minh City",
      phone: "0901234567",
      description: "The most premium cinema experience in HCMC.",
    });

    const theater2 = await Theater.create({
      name: "Nova Cinema Hanoi",
      location: "Hoan Kiem, Hanoi",
      address: "456 Trang Tien, Hoan Kiem",
      city: "Hanoi",
      phone: "0909876543",
      description: "State of the art screens and sounds in the capital.",
    });

    console.log("Creating Rooms...");
    await Room.insertMany([
      {
        name: "Screen 1 - IMAX",
        theater: theater1._id,
        capacity: 100,
        layout: { rows: 10, columns: 10 },
      },
      {
        name: "Screen 2 - Standard",
        theater: theater1._id,
        capacity: 80,
        layout: { rows: 8, columns: 10 },
      },
      {
        name: "Screen 1 - Premium",
        theater: theater2._id,
        capacity: 50,
        layout: { rows: 5, columns: 10 },
      },
    ]);

    console.log("Seed data successfully imported!");
    process.exit();
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
