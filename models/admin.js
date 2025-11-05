const mongoose = require("mongoose");
const passwordLocalMongoose = require("passport-local-mongoose");

const adminSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },

    name: {
        type: String,
        required: true
    },

    // email: {
    //     type: String,
    //     unique: true,
    //     required: true
    // },

    // password: {
    //     type: String,
    //     required: true,
    //     unique: true
    // },

    role: {
        type: String,
        default: "admin"
    },

    createdAt: {
        type: Date,
        default: Date.now()
    }
});

// adminSchema.plugin(passwordLocalMongoose, {
//     usernameField: "email"
// });

module.exports = mongoose.model("Admin", adminSchema);
