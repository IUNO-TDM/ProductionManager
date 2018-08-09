var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Machine = require('../models/machine');
var printer_adapter = require('../adapter/ultimaker_printer_adapter');
var async = require('async');
var parseString = require('xml2js').parseString;
var _ = require('lodash');
var request = require('request');

_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Machine = require('../models/machine');
var printer_adapter = require('../adapter/ultimaker_printer_adapter');
var async = require('async');
var parseString = require('xml2js').parseString;
var _ = require('lodash');
const licenseManager = require('../adapter/license_manager_adapter')

_.mapPick = function (objs, keys) {
    return _.map(objs, function (obj) {
        return _.pick(obj, keys)
    })
};

router.get('/', function (req, res, next) {
    if (req.param('refreshHsmIds') == 'true') {
        licenseManager.updateMachines((err, machines) => {
            if (err) {
                return next(err);
            }

            res.json(_.mapPick(machines, ['id', 'displayname', 'variant', 'hostname', 'hsmIds']));
        })
    } else {
        Machine.find(function (err, machines) {
            if (err) {
                return next(err);
            }

            res.json(_.mapPick(machines, ['id', 'displayname', 'variant', 'hostname', 'hsmIds']));
        })
    }
});

router.get('/:id', function (req, res, next) {
    Machine.findById(req.params.id, function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(post, ['id', 'displayname', 'variant', 'hostname', 'hsmIds']));
    })
});

router.post('/:id/authentication', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }

        printer_adapter.requestAuthentication(machine.hostname, "hurz", "foo", function (err, data) {
            if (data && data.id && data.key) {
                machine.auth_id = data.id;
                machine.auth_key = data.key;
                Machine.findByIdAndUpdate(machine._id, machine, function (err, doc) {
                    if (!err) {
                        res.sendStatus(201);
                    } else {
                        res.status(500);
                        res.send(err);
                    }
                });
            } else {
                res.status(500);
                res.send(data);
            }
        });
    });
});

router.get('/:id/authentication', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        if (!machine.auth_id || !machine.auth_key) {
            res.status(200);
            return res.send({ "message": "not authenticated" });
        }
        printer_adapter.checkAuthentication(machine.hostname, machine.auth_id, function (err, data) {
            res.send(data);
        });
    });
});

router.get('/:id/authentication/verify', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        if (!machine.auth_id || !machine.auth_key) {
            res.status(200);
            return res.send({ "message": "not authenticated" });
        }
        printer_adapter.verifyAuthentication(machine.hostname, machine.auth_id, machine.auth_key, function (err, data) {
            res.send(data);
        });
    });
});

router.get('/:id/materials/active', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }

        async.series([
            function (callback) {
                printer_adapter.getActiveMaterial(machine.hostname, 0, callback)
            },
            function (callback) {
                printer_adapter.getActiveMaterial(machine.hostname, 1, callback)
            }], function (err, results) {
                if (err) {
                    res.status(500);
                    res.send(err.message);
                } else {
                    res.send(results);
                }
            }
        );

    });
});

router.get('/:id/materials/active/:extruderid', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getActiveMaterial(machine.hostname, req.params.extruderid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/materials/:materialid', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/materials/:materialid/short', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {

                parseString(data, function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                    } else {
                        const name = result.fdmmaterial.metadata[0].name[0];
                        const brand = name.brand[0];
                        const material = name.material[0];
                        const color = name.color[0];

                        res.send({ 'brand': brand, 'material': material, 'color': color });
                    }
                })


            }
        });

    });
});

router.get('/:id/materials/:materialid/name', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {

                parseString(data, function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                    } else {
                        const name = result.fdmmaterial.metadata[0].name[0];
                        const brand = name.brand[0];
                        const material = name.material[0];
                        const color = name.color[0];

                        res.send(brand + " " + material + " " + color);
                    }
                })


            }
        });

    });
});

router.get('/:id/status', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrinterStatus(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJob(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob/state', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobState(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob/progress', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobProgress(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/total', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobTimeTotal(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/elapsed', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobTimeElapsed(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/remaining', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        async.series([function (callback) {
            printer_adapter.getPrintJobTimeElapsed(machine.hostname, callback)
        }, function (callback) {
            printer_adapter.getPrintJobTimeTotal(machine.hostname, callback)
        }], function (err, results) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + Math.max((results[1] - results[0]), 0));
            }
        });
    });
});

router.delete('/:id', function (req, res, next) {
    Machine.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        res.json(post);
    })
});


module.exports = router;

router.get('/:id', function (req, res, next) {
    Machine.findById(req.params.id, function (err, post) {
        if (err) {
            return next(err);
        }

        res.json(_.pick(post, ['_id', 'displayname', 'variant', 'hostname']));
    })
});

router.post('/:id/authentication', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }

        printer_adapter.requestAuthentication(machine.hostname, "hurz", "foo", function (err, data) {
            if (data && data.id && data.key) {
                machine.auth_id = data.id;
                machine.auth_key = data.key;
                Machine.findByIdAndUpdate(machine._id, machine, function (err, doc) {
                    if (!err) {
                        res.sendStatus(201);
                    } else {
                        res.status(500);
                        res.send(err);
                    }
                });
            } else {
                res.status(500);
                res.send(data);
            }
        });
    });
});

router.get('/:id/authentication', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        if (!machine.auth_id || !machine.auth_key) {
            res.status(200);
            return res.send({ "message": "not authenticated" });
        }
        printer_adapter.checkAuthentication(machine.hostname, machine.auth_id, function (err, data) {
            res.send(data);
        });
    });
});

router.get('/:id/authentication/verify', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        if (!machine.auth_id || !machine.auth_key) {
            res.status(200);
            return res.send({ "message": "not authenticated" });
        }
        printer_adapter.verifyAuthentication(machine.hostname, machine.auth_id, machine.auth_key, function (err, data) {
            res.send(data);
        });
    });
});

router.get('/:id/materials/active', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }

        async.series([
            function (callback) {
                printer_adapter.getActiveMaterial(machine.hostname, 0, callback)
            },
            function (callback) {
                printer_adapter.getActiveMaterial(machine.hostname, 1, callback)
            }], function (err, results) {
                if (err) {
                    res.status(500);
                    res.send(err.message);
                } else {
                    res.send(results);
                }
            }
        );

    });
});

router.get('/:id/materials/active/:extruderid', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getActiveMaterial(machine.hostname, req.params.extruderid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/materials/:materialid', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/materials/:materialid/short', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {

                parseString(data, function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                    } else {
                        const name = result.fdmmaterial.metadata[0].name[0];
                        const brand = name.brand[0];
                        const material = name.material[0];
                        const color = name.color[0];

                        res.send({ 'brand': brand, 'material': material, 'color': color });
                    }
                })


            }
        });

    });
});

router.get('/:id/materials/:materialid/name', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getMaterialDetails(machine.hostname, req.params.materialid, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {

                parseString(data, function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                    } else {
                        const name = result.fdmmaterial.metadata[0].name[0];
                        const brand = name.brand[0];
                        const material = name.material[0];
                        const color = name.color[0];

                        res.send(brand + " " + material + " " + color);
                    }
                })


            }
        });

    });
});

router.get('/:id/status', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrinterStatus(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJob(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob/state', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobState(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send(data);
            }
        });

    });
});

router.get('/:id/printjob/progress', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobProgress(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/total', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobTimeTotal(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/elapsed', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        printer_adapter.getPrintJobTimeElapsed(machine.hostname, function (err, data) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + data);
            }
        });

    });
});

router.get('/:id/printjob/time/remaining', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        async.series([function (callback) {
            printer_adapter.getPrintJobTimeElapsed(machine.hostname, callback)
        }, function (callback) {
            printer_adapter.getPrintJobTimeTotal(machine.hostname, callback)
        }], function (err, results) {
            if (err) {
                res.status(500);
                res.send(err.message);
            } else {
                res.send('' + Math.max((results[1] - results[0]), 0));
            }
        });
    });
});

router.get('/:id/camera/stream', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        request('http://' + machine.hostname + ':8080/?action=stream').on('error', function(error) {
            return res.sendStatus(404);
        }).pipe(res);
    });
});

router.get('/:id/camera/snapshot', function (req, res, next) {
    Machine.findById(req.params.id, function (err, machine) {
        if (!machine || !machine.hostname) {
            return res.sendStatus(404);
        }
        request('http://' + machine.hostname + ':8080/?action=snapshot').on('error', function(error) {
            return res.sendStatus(404);
        }).pipe(res);
    });
});

router.delete('/:id', function (req, res, next) {
    Machine.findByIdAndRemove(req.params.id, req.body, function (err, post) {
        if (err) {
            return next(err);
        }
        res.json(post);
    })
});


module.exports = router;