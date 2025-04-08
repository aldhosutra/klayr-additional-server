#!/bin/bash

cd /var/www/snapshots/mainnet && find . -type f -mtime +7 -exec rm {} \;
cd /var/www/snapshots/testnet && find . -type f -mtime +7 -exec rm {} \;