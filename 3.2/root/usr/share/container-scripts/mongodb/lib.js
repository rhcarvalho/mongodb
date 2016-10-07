var log;
var soon;

(function() {
    "use strict";

    var defaultTimeout = 5 * 60 * 1000; /*ms*/
    var defaultInterval = 500; /*ms*/

    // log prints msg with a standard format, including the current date and
    // time. This is meant to ease finding messages among regular mongod logs.
    log = function(msg) {
        var now = new Date().toISOString();
        print(`=> ${now} ${msg}`);
    };

    // soon calls f until it returns true or the timeout is met. It returns true
    // if f succeeded or false in case of a timeout.
    soon = function(f, timeout /*ms*/, interval) {
        var start = new Date();
        timeout = timeout || defaultTimeout;
        interval = interval || defaultInterval;
        var diff;
        while (1) {
            if (f()) {
                return true;
            }
            diff = (new Date()).getTime() - start.getTime();
            if (diff > timeout) {
                return false;
            }
            sleep(interval);
        }
    };
}());
