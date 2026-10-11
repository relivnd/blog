#!/bin/bash

set -e
set -u
set -o pipefail

echo "Running Deployment Script"

which aws || echo "AWS CLI not found"
aws --version || echo "AWS CLI version check failed"
aws sts get-caller-identity || echo "AWS credentials not configured"

echo "Syncing to S3..."
aws s3 sync public/ s3://blog.relivnd.dev --delete

echo "Creating CloudFront invalidation..."
aws cloudfront create-invalidation --distribution-id E2LOIVE2VIQGWU --paths "/*"
