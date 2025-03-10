# Create project with Turborepo
mkdir booking-platform
cd booking-platform

# Initialize project with npm
npm init -y

# Install Turborepo
npm install turbo --save-dev

# Create directories
mkdir -p apps/frontend
mkdir -p apps/api-gateway
mkdir -p apps/user-service
mkdir -p apps/event-service
mkdir -p apps/booking-service
mkdir -p apps/payment-service
mkdir -p packages/eslint-config
mkdir -p packages/typescript-config
mkdir -p packages/database
mkdir -p packages/utils
