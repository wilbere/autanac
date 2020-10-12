#!/bin/sh

set -e

autanac_CONFIGURATION_DIR=/etc/autanac
autanac_CONFIGURATION_FILE=$autanac_CONFIGURATION_DIR/autanac.conf
autanac_DATA_DIR=/var/lib/autanac
autanac_GROUP="autanac"
autanac_LOG_DIR=/var/log/autanac
autanac_LOG_FILE=$autanac_LOG_DIR/autanac-server.log
autanac_USER="autanac"

if ! getent passwd | grep -q "^autanac:"; then
    groupadd $autanac_GROUP
    adduser --system --no-create-home $autanac_USER -g $autanac_GROUP
fi
# Register "$autanac_USER" as a postgres user with "Create DB" role attribute
su - postgres -c "createuser -d -R -S $autanac_USER" 2> /dev/null || true
# Configuration file
mkdir -p $autanac_CONFIGURATION_DIR
# can't copy debian config-file as addons_path is not the same
if [ ! -f $autanac_CONFIGURATION_FILE ]
then
    echo "[options]
; This is the password that allows database operations:
; admin_passwd = admin
db_host = False
db_port = False
db_user = $autanac_USER
db_password = False
addons_path = /usr/lib/python3.7/site-packages/autanac/addons
" > $autanac_CONFIGURATION_FILE
    chown $autanac_USER:$autanac_GROUP $autanac_CONFIGURATION_FILE
    chmod 0640 $autanac_CONFIGURATION_FILE
fi
# Log
mkdir -p $autanac_LOG_DIR
chown $autanac_USER:$autanac_GROUP $autanac_LOG_DIR
chmod 0750 $autanac_LOG_DIR
# Data dir
mkdir -p $autanac_DATA_DIR
chown $autanac_USER:$autanac_GROUP $autanac_DATA_DIR

INIT_FILE=/lib/systemd/system/autanac.service
touch $INIT_FILE
chmod 0700 $INIT_FILE
cat << EOF > $INIT_FILE
[Unit]
Description=autanac Open Source ERP and CRM
After=network.target

[Service]
Type=simple
User=autanac
Group=autanac
ExecStart=/usr/bin/autanac --config $autanac_CONFIGURATION_FILE --logfile $autanac_LOG_FILE
KillMode=mixed

[Install]
WantedBy=multi-user.target
EOF
