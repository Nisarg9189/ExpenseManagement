class ExpressError extends Error {
    constructor(statusCose, message) {
        super();
        this.statusCose = statusCose;
        this.message = message;
    }
}

module.exports = ExpressError;