const mongoose = require("mongoose");


const managerSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },

    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        unique: true,
        required: true,
    },

    // password: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },

    role: {
        type: String,
        default: "manager"
    },

    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports =  mongoose.model("Manager", managerSchema);