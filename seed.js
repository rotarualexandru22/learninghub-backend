require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');

const mongoURI = process.env.MONGO_URI;

const coursesData = [
  {
    title: "React 19 & Next.js 15 Production Blueprints",
    description: "Master modern frontend engineering with React 19 server components, Next.js App Router, and scalable architecture pattern deployments.",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800",
    instructor: "Andrew Irons",
    category: "Development",
    level: "Intermediate",
    lessons: [
      { title: "React 19 Server Components Architecture", description: "Deep dive into React Server Components vs Client Components using video streams.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", duration: "0:15", order: 1 },
      { title: "Next.js App Router & Parallel Routing", description: "Learn how to build complex layout structures using modern routing engines.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", duration: "0:15", order: 2 },
      { title: "Server Actions and Form Optimistic Updates", description: "Mutate data securely on the server without creating explicit API endpoints.", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", duration: "0:15", order: 3 }
    ]
  }
];

const seedDatabase = async () => {
  try {
    if (!mongoURI) { process.exit(1); }
    await mongoose.connect(mongoURI);
    await Course.deleteMany({});
    await Lesson.deleteMany({});

    for (const data of coursesData) {
      const { lessons, ...courseFields } = data;
      const course = new Course(courseFields);
      const savedCourse = await course.save();

      const hydatedLessons = lessons.map(lesson => ({
        ...lesson,
        courseId: savedCourse._id
      }));
      await Lesson.insertMany(hydatedLessons);
    }
    console.log("DATABASE CLEANED & POPULATED // 1 Premium Course Matrix Ready.");
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

seedDatabase();