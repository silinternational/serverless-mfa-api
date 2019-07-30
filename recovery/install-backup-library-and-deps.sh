#!/usr/bin/env bash

# Exit script with error if any step fails.
set -e

sudo npm install gulp-cli -g
sudo npm i -g npm

cd ./recovery

curl --fail --location --remote-name https://github.com/silinternational/DynamoDbBackUp/archive/master.zip
unzip master.zip
rm master.zip
mv DynamoDbBackUp-master DynamoDbBackUp

cd DynamoDbBackUp

npm install

cd ../..
