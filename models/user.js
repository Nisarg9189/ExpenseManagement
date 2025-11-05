const { required } = require("joi");
const mongoose = require("mongoose");
const passwordLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },

    managerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Manager",
        required: false,
        default: null,
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true
    },

    // password: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },

    role: {
        type: String,
        enum: ["user", "manager", "admin"],
        default: "user"
    },

    // accessGivenBy: {
    //     type: mongoose.Types.ObjectId,
    //     ref: "Admin",
    // },

    createdAt: {
        type: Date,
        default: Date.now()
    }
});

userSchema.plugin(passwordLocalMongoose, {
    usernameField: "email"
});

module.exports = mongoose.model("User", userSchema);
