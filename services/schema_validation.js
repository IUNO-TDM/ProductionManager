const logger = require('../global/logger');

module.exports = function (err, req, res, next) {

    let responseData;

    if (err.name === 'JsonSchemaValidationError') {
        logger.warn(JSON.stringify(err.validationErrors));

        // Set a bad request http response status or whatever you want
        res.status(400);

        // Format the response body however you want
        responseData = {
            statusText: 'Bad Request',
            jsonSchemaValidation: true,
            validations: err.validationErrors  // All of your validation information
        };

        return res.json(responseData);
    }

    next(err);
}