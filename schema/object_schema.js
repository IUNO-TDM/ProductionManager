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

self.Object_Query = {
    type: 'object',
    properties: {
        materials: {
            type: 'array',
            items: {
                type: 'string',
                format: 'uuid'
            },
            additionalItems: false
        },
        machines: {
            type: 'array',
            items: {
                type: 'string',
                format: 'uuid'
            },
            additionalItems: false
        },
        lang: languageProperty,
        purchased: {
            type: 'string',
            enum: ['true', 'false']
        }
    },
    required: [ 'lang'],
    additionalProperties: false
};

self.GetBinary_Query = {
    type: 'object',
    properties: {
    },
    required: [],
    additionalProperties: false
};

self.SaveObject_Body = {
    type: 'object',
    properties: {
        title: {
            type: 'string',
            minLength: 5,
            maxLength: 200
        },
        encryptedBinary: {
            type: 'string',
            pattern: '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$',
            minLength: 1,
            maxLength: 100000
        },
        description: {
            type: 'string',
            minLength: 1,
            maxLength: 1000
        },
        licenseFee: {
            type: 'integer',
            maximum: Number.MAX_SAFE_INTEGER
        },
        components: {
            type: 'array',
            minLength: 1,
            maxLength: 10,
            items: {
                type: 'string',
                format: 'uuid'
            }
        },
        backgroundColor: {
            type: 'string',
            maxLength: 9,
            pattern: '^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$'
        },
        image: {
            type: 'string',
            maxLength: 10000
        }
    },
    required: ['title', 'encryptedBinary', 'description', 'licenseFee', 'components'],
    additionalProperties: false
};


module.exports = self;