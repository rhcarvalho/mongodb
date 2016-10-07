#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

source "${CONTAINER_SCRIPTS_PATH}/common.sh"

function create_users() {
  info "Creating MongoDB users ..."
  mongo_create_admin
  mongo_create_user "-u admin -p ${MONGODB_ADMIN_PASSWORD}"
}

info "Waiting for local MongoDB to accept connections ..."
wait_for_mongo_up &>/dev/null

# PetSet pods are named with a predictable name, following the pattern:
#   $(petset name)-$(zero-based index)
# MEMBER_ID is computed by removing the prefix matching "*-", i.e.:
#  "mongodb-0" -> "0"
#  "mongodb-1" -> "1"
#  "mongodb-2" -> "2"
readonly MEMBER_ID="${HOSTNAME##*-}"

# Need to change current directory to access javascript files.
cd "${CONTAINER_SCRIPTS_PATH}"

# Initialize replica set only if we're the first member
if [ "${MEMBER_ID}" = '0' ]; then
  mongo --shell --quiet replicaset.js <<<'initiate()'
  create_users
else
  mongo --shell --quiet \
    --host "$(replset_addr)" \
    -u admin -p "${MONGODB_ADMIN_PASSWORD}" --authenticationDatabase admin \
    replicaset.js <<<'addMember()'
fi
