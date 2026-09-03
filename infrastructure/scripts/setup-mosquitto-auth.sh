#!/usr/bin/env bash
# ==============================================================================
# [NOTE] Mosquitto Authentication Setup Script (setup-mosquitto-auth.sh)
#
# Role: Helper script to generate or update the hashed Mosquitto `passwd` file.
# Uses a one-off Docker container so developers don't need `mosquitto_passwd`
# installed locally on their machine.
#
# Usage:
#   chmod +x ./scripts/setup-mosquitto-auth.sh
#   ./scripts/setup-mosquitto-auth.sh [username] [password]
#
# If arguments are omitted, defaults from `.env` or script defaults are used.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$INFRA_DIR/mosquitto/config"
PASSWD_FILE="$CONFIG_DIR/passwd"

# Load environment variables if .env exists
if [ -f "$INFRA_DIR/.env" ]; then
  # shellcheck disable=SC1091
  source "$INFRA_DIR/.env"
fi

USERNAME="${1:-${MQTT_DEV_USER:-legacy_admin}}"
PASSWORD="${2:-${MQTT_DEV_PASS:-legacy_secret_2026}}"

echo "[INFO] Target password file: $PASSWD_FILE"
echo "[INFO] Creating/updating user: $USERNAME"

# Ensure config directory exists
mkdir -p "$CONFIG_DIR"

# Run ephemeral Docker container to generate password hash
if [ ! -f "$PASSWD_FILE" ]; then
  echo "[INFO] File does not exist. Creating new password file..."
  touch "$PASSWD_FILE"
  docker run --rm -v "$CONFIG_DIR":/mosquitto/config eclipse-mosquitto:2 \
    mosquitto_passwd -c -b /mosquitto/config/passwd "$USERNAME" "$PASSWORD"
else
  echo "[INFO] Updating existing password file..."
  docker run --rm -v "$CONFIG_DIR":/mosquitto/config eclipse-mosquitto:2 \
    mosquitto_passwd -b /mosquitto/config/passwd "$USERNAME" "$PASSWORD"
fi

# Ensure appropriate file permissions
chmod 0644 "$PASSWD_FILE"

echo "[SUCCESS] Password file successfully configured at: $PASSWD_FILE"
echo "[NOTE] Reminder: '$PASSWD_FILE' is ignored by Git to protect secrets."
