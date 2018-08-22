/**
 * Created by beuttlerma on 09.02.17.
 */

const self = {};

self.PatchObject_Body = {
    type: 'object',
    minProperties: 1,
    maxProperties: 2,
    properties: {
        name: {
            type: 'string',
            minLength: 5,
            maxLength: 200
        },
        description: {
            type: 'string',
            minLength: 1,
            maxLength: 1000
        }
    },
    required: [],
    additionalProperties: false
};

module.exports = self;