#!/usr/bin/env bash
set -eu

# Bootstrap script for an Ubuntu-based Azure VM that will serve the static
# frontend with PM2.

NODE_MAJOR="${NODE_MAJOR:-20}"
APP_USER="${APP_USER:-$USER}"

sudo apt-get update
sudo apt-get install -y curl rsync

# Install Node.js from NodeSource if node is not already available.
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Install PM2 globally if it is not already available.
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

# Enable PM2 startup so the served app can come back after a VM reboot.
sudo env "PATH=$PATH" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"

echo "Bootstrap complete."
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"
echo "Next step: run 'pm2 save' after your first deployment."
