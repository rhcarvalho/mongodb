load("env.js");
load("lib.js");

var initiate;
var createUsers;

(function() {
    "use strict";

    function isPrimary() {
        var isMaster = db.isMaster();
        return isMaster.ismaster && (isMaster.me === isMaster.primary);
    }

    // initiate initializes a replica set.
    initiate = function() {
        var name = env.MONGODB_REPLICA_NAME;

        if (db.isMaster().setName == name) {
            log(`Replica set '${name}' already exists, skipping initialization`);
            // return;                                                          // FIXME
        }

        var host = getHostName();

        var config = {
            _id: name,
            members: [{_id: 0, host: host}],
        };

        log(`Initiating replica set using: ${JSON.stringify(config, null, 2)}`);

        rs.initiate(config);

        // wait until replica set member becomes PRIMARY.
        if (soon(isPrimary, 5 * 1000)) {                                        // FIXME
            log("Successfully initialized replica set");
        } else {
            log("Timed out waiting to become PRIMARY");
        }
    };

    // createUsers creates users
    createUsers = function() {
        log("Creating MongoDB users...");
        throw "Not implemented";
        // mongo_create_admin
        // mongo_create_user "-u admin -p ${MONGODB_ADMIN_PASSWORD}"
    };
}());
