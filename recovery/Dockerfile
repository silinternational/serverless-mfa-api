FROM node:18

RUN apt-get update && \
    apt-get install -y python3 && \
    apt-get install -y python3-venv

RUN ln -s /usr/bin/python3 /usr/bin/python

# Install the AWS CLI
RUN curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
RUN unzip awscli-bundle.zip
RUN ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

# Install the Serverless Framework
RUN npm install -g serverless@3.25 && echo "aws version: " && aws --version
