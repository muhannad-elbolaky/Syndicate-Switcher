#!/bin/bash

# Function to check if a command exists
command_exists() {
  type "$1" >/dev/null 2>&1
}

# Function to install NVM if not already installed
install_nvm() {
  echo "NVM (Node Version Manager) is not installed. Installing..."
  # Install NVM (curl method)
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  # Load NVM into current shell session
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"                   # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion" # This loads nvm bash_completion
}

# Function to install bun if not already installed
install_bun() {
  echo "bun is not installed. Installing..."

  # Install bun
  if ! curl -fsSL https://bun.sh/install | bash; then
    echo "Failed to install bun. Please install it manually."
    exit 1
  fi

  # Source the shell to make bun available in the current session
  if [ -f ~/.bashrc ]; then
    source ~/.bashrc
  elif [ -f ~/.zshrc ]; then
    source ~/.zshrc
  else
    echo "Failed to source shell configuration. Please check manually."
    exit 1
  fi

  # Check if installation was successful
  if ! command_exists bun; then
    echo "Failed to configure bun. Please check installation manually."
    exit 1
  fi
}

# Check if NVM is installed
if ! command_exists nvm; then
  install_nvm
else
  echo "NVM (Node Version Manager) is already installed."
fi

# Check if bun is installed
if ! command_exists bun; then
  install_bun
else
  echo "bun is already installed."
fi

# Install the latest Node.js version and use it
echo "Installing the latest Node.js version..."
nvm install node && nvm use node

# Display installed Node.js version
echo "Node.js version:"
node --version

# Check bun version
echo "bun version:"
bun --version
