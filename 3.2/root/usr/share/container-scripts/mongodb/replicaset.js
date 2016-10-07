load("env.js");
load("lib.js");

var initiate;
var createUsers;
var addMember;

(function() {
    "use strict";

    var States = {
        1: "PRIMARY",
        2: "SECONDARY",
    };

    function isPrimary() {
        var isMaster = db.isMaster();
        return isMaster.ismaster && (isMaster.me === isMaster.primary);
    }

    // initiate initializes a replica set. It is safe to call this function if a
    // replica set is already configured.
    initiate = function(host) {
        var name = env.MONGODB_REPLICA_NAME;

        if (db.isMaster().setName == name) {
            log(`Replica set '${name}' already exists, skipping initialization`);
            return;
        }

        host = host || getHostName();

        var config = {
            _id: name,
            members: [{_id: 0, host: host}],
        };

        log(`Initiating replica set using: ${prettyjson(config)}`);

        var ret = rs.initiate(config);
        if (!ret.ok) {
            log(`Failed to initialize replica set: ${prettyjson(ret)}`)
            return;
        }

        // wait until replica set member becomes PRIMARY.
        if (soon(isPrimary)) {
            log("Successfully initialized replica set");
        } else {
            log("Timed out waiting to become PRIMARY");
        }
    };

    // createUsers creates users.
    createUsers = function() {
        log("Creating MongoDB users...");
        throw "Not implemented";
        // mongo_create_admin
        // mongo_create_user "-u admin -p ${MONGODB_ADMIN_PASSWORD}"
    };

    // addMember adds the current host to the replica set configuration. It is
    // safe to call this function if the host is already in the configuration.
    addMember = function(host) {
        host = host || getHostName();
        log(`Adding '${host}' to replica set...`);

        // https://github.com/mongodb/mongo/blob/r3.2.6/src/mongo/base/error_codes.err#L105
        var NewReplicaSetConfigurationIncompatible = 103;

        var ret = rs.add(host);

        // check error, ignore error when host is already in the replica set.
        if (!ret.ok && ret.code !== NewReplicaSetConfigurationIncompatible) {
            log(`Failed to add replica set member: ${prettyjson(ret)}`)
            return false;
        }

        log(`Successfully added '${host}' to replica set`);

        // wait until replica set member starts up.
        var ok = soon(() => isPrimary() || isSecondary());
        var state = States[rs.status().myState];
        if (ok) {
            log(`Replica set member became ${state}`);
        } else {
            log(`Timed out waiting for PRIMARY or SECONDARY, member state is ${state}`);
        }
    };
}());
