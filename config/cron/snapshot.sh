#!/bin/bash

export NVM_DIR="/root/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 18 >/dev/null
export PATH="/root/.nvm/versions/node/v18.20.8/bin:$PATH"

MODE="mainnet"

/root/.nvm/versions/node/v18.20.8/bin/pm2 stop klayr-core
rm /root/snapshot/blockchain.tar.gz

if ! /root/.nvm/versions/node/v18.20.8/lib/node_modules/klayr-core/bin/run blockchain export -o /root/snapshot; then
  echo "Export failed" >&2
  exit 1
fi

/root/.nvm/versions/node/v18.20.8/bin/node /root/.nvm/versions/node/v18.20.8/bin/pm2 start klayr-core

NOW=$( date +'%Y%m%d%H%M' )

NEW=$(stat -c%s /root/snapshot/blockchain.tar.gz)
OLD=$(stat -c%s /root/snapshot/uploaded/blockchain.db.tar.gz)

declare -i NEW1=$NEW
declare -i OLD1=$OLD

if (( $NEW1 > $OLD1 )); then
cp /root/snapshot/blockchain.tar.gz /root/snapshot/uploaded/blockchain.db.tar.gz
sha256sum /root/snapshot/uploaded/blockchain.db.tar.gz > /root/snapshot/uploaded/blockchain.db.tar.gz.SHA256

scp -i "/root/key/load-balancer.pem" /root/snapshot/uploaded/blockchain.db.tar.gz root@185.55.240.12:/var/www/snapshots/$MODE/blockchain.db.tar.gz
scp -i "/root/key/load-balancer.pem" /root/snapshot/uploaded/blockchain.db.tar.gz.SHA256 root@185.55.240.12:/var/www/snapshots/$MODE/blockchain.db.tar.gz.SHA256

ssh -i "/root/key/load-balancer.pem" root@185.55.240.12 "cp /var/www/snapshots/$MODE/blockchain.db.tar.gz /var/www/snapshots/$MODE/blockchain-$NOW.db.tar.gz"
ssh -i "/root/key/load-balancer.pem" root@185.55.240.12 "cp /var/www/snapshots/$MODE/blockchain.db.tar.gz.SHA256 /var/www/snapshots/$MODE/blockchain-$NOW.db.tar.gz.SHA256"
fi