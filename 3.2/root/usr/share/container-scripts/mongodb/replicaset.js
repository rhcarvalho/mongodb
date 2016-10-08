load("env.js");
load("lib.js");

var initiate;
var createUsers;
var addMember;

(function() {
    "use strict";

    var defaultPort = 27017;

    function isPrimary() {
        var isMaster = db.isMaster();
        return isMaster.ismaster && (isMaster.me === isMaster.primary);
    }

    function hostHasState(host, states) {
        return rs.status().members.some((m) =>
            m.name.startsWith(host) && (states.indexOf(m.stateStr) > -1));
    }

    function getStateStr(host) {
        return (rs.status().members.filter((m) =>
            m.name.startsWith(host)) || [])[0].stateStr;
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

        var alreadyAdded = rs.conf().members.some((m) =>
            m.host === host || m.host === host + ":" + defaultPort);

        if (alreadyAdded) {
            log(`Host '${host}' already in replica set, skipping`);
            return;
        }

        log(`Adding '${host}' to replica set...`);

        var ret = rs.add(host);
        if (!ret.ok) {
            log(`Failed to add replica set member: ${prettyjson(ret)}`)
            return;
        }

        log(`Successfully added '${host}' to replica set`);

        // wait until replica set member starts up.
        var ok = soon(() => hostHasState(host, ["PRIMARY", "SECONDARY"]));
        var state = getStateStr(host);
        if (ok) {
            log(`Replica set member is now ${state}`);
        } else {
            log(`Timed out waiting for PRIMARY or SECONDARY, member state is ${state}`);
        }
    };
}());
