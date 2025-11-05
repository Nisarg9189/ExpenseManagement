const Joi = require("joi");
const expense = require("./models/expense");
const company = require("./models/company");
const manager = require("./models/manager");

module.exports.addUserSchema = Joi.object({
    expense: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        role: Joi.string().valid("manager", "user").required(),
        managerId: Joi.string().allow(null, ''),
    }).required()
});

module.exports.addExpenseSchema = Joi.object({
    expense: Joi.object({
        title: Joi.string().required(),
        amount: Joi.number().required(),
        category: Joi.string().required(),
        date: Joi.date().required(),
        description: Joi.string().required(),
    }).required()
});

module.exports.signUp = Joi.object({
    company: Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        adminname: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }).required()
})