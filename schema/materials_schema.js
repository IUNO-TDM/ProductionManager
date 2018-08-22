/**
 * Created by beuttlerma on 09.02.17.
 */

const self = {};

const languageProperty = {
    type: 'string',
    enum: ['de', 'en']
};

self.Empty = {
    type: 'object',
    properties: {},
    additionalProperties: false
};

self.Material_Query = {
    type: 'object',
    properties: {
        lang: languageProperty
    },
    required: ['lang'],
    additionalProperties: false,
};

module.exports = self;