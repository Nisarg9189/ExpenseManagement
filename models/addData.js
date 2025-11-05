const mongoose = require("mongoose");
const Company = require("./company.js");
const Admin  = require("./admin.js");
const Manager = require("./manager.js");
const User = require("./user.js");
const Expense = require("./expense.js");

// main().then(() => {
//     console.log("connected to DB");
// }).catch(err => console.log(err));

// async function main() {
//   await mongoose.connect('mongodb://127.0.0.1:27017/expenseManagement');

//   // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
// }

const seedDatabase = async () => {

    // --- 1️⃣ Create Company
    const company = new Company({
      name: "TechNova Pvt Ltd",
      address: "Ahmedabad, Gujarat, India",
    });
    await company.save();
    console.log("🏢 Company created:", company._id);

    // --- 2️⃣ Create Admin
    const admin = new Admin({
      companyId: company._id,
      name: "Nisarg Patel",
      email: "nisarg@technova.com",
      password: "hashedpassword123",
    });
    await admin.save();
    console.log("👑 Admin created:", admin._id);

    // --- 3️⃣ Create Manager
    const manager = new Manager({
      companyId: company._id,
      adminId: admin._id,
      name: "Ravi Mehta",
      email: "ravi@technova.com",
      password: "hashedpassword789",
    });
    await manager.save();
    console.log("🧑‍💼 Manager created:", manager._id);

    // --- 4️⃣ Create Users
    const user1 = new User({
      companyId: company._id,
      adminId: admin._id,
      managerId: manager._id,
      name: "Harsh Solanki",
      email: "harsh@technova.com",
      password: "hashedharsh111",
      accessGivenBy: admin._id,
    });
    await user1.save();

    const user2 = new User({
      companyId: company._id,
      adminId: admin._id,
      managerId: manager._id,
      name: "Dhruv Patel",
      email: "dhruv@technova.com",
      password: "hasheddhruv222",
      accessGivenBy: admin._id,
    });
    await user2.save();

    console.log("👥 Users created:", user1._id, user2._id);

    // --- 5️⃣ Create Expenses
    const expense1 = new Expense({
      companyId: company._id,
      adminId: admin._id,
      managerId: manager._id,
      userId: user1._id,
      title: "Cab to client meeting",
      amount: 350,
      category: "Travel",
      status: "Approved",
      description: "Cab from office to Infocity",
    });
    await expense1.save();

    const expense2 = new Expense({
      companyId: company._id,
      adminId: admin._id,
      managerId: manager._id,
      userId: user2._id,
      title: "Team lunch",
      amount: 900,
      category: "Food",
      status: "Pending",
      description: "Lunch after project delivery",
    });
    await expense2.save();

    console.log("💰 Expenses created:", expense1._id, expense2._id);

    console.log("✅ Database seeding complete!");
};

// seedDatabase();
