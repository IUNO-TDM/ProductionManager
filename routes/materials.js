const express = require('express');
const router = express.Router();
const logger = require('../global/logger');
const ams_adapter = require('../adapter/ams_adapter');


const Validator = require('express-json-validator-middleware').Validator;
const validator = new Validator({allErrors: true});
const validate = validator.validate;
const validation_schema = require('../schema/materials_schema');

router.get('/', validate({
    query: validation_schema.Material_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    const language = req.query['lang'] || 'en';
    ams_adapter.getAllMaterials(language, (err, materials) => {

        if (err) {
            return next(err);
        }
        res.json(materials ? materials : []);
    })
});

router.get('/hierarchical', validate({
    query: validation_schema.Material_Query,
    body: validation_schema.Empty
}), function (req, res, next) {
    const language = req.query['lang'] || 'en';
    ams_adapter.getAllMaterials(language, (err, materials) => {

        if (err) {
            return next(err);
        }
        const sorted = materials.map((material) => {
            if (!material.parentId) {
                material.parentId = "0"
            }
            return material;
        }).reduce((ordered, material) => {
            if (!ordered[material.parentId]) {
                ordered[material.parentId] = [];
            }
            ordered[material.parentId].push(material);
            return ordered;
        }, {});
        var hierarchicalMaterials = [];
        //first step with the sorted materials: find the root uuids
        var rootUUIDs = [];
        for (let key in sorted) {
            let found = false;
            for (let material of materials) {
                if (material.id === key) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                rootUUIDs.push(key);
                hierarchicalMaterials = hierarchicalMaterials.concat(sorted[key]);
            }
        }

        const findAndInsertMaterials = function (hierarchy, parent, materials) {
            if (!hierarchy || hierarchy.length === 0) {
                return false;
            }
            for (let material of hierarchy) {
                if (material.id === parent) {
                    material.children = materials;
                    return true;
                }
                if (material.children && material.children.length > 0) {
                    if (findAndInsertMaterials(material.children, parent, materials)) {
                        return true;
                    }
                }
            }
            return false;
        };

        for (let key in sorted) {
            if (rootUUIDs.indexOf(key) !== -1) {
                continue;
            }
            findAndInsertMaterials(hierarchicalMaterials, key, sorted[key]);
        }
        res.json(hierarchicalMaterials ? hierarchicalMaterials : [])
    })
});


module.exports = router;