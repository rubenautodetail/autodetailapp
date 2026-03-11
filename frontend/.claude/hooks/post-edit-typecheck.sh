#!/bin/bash
# Run tsc after any TypeScript file edit — catch errors immediately
cd "$(dirname "$0")/../../"
if [[ "$CLAUDE_TOOL_NAME" == "Edit" || "$CLAUDE_TOOL_NAME" == "Write" ]]; then
  FILE="$CLAUDE_TOOL_INPUT_FILE_PATH"
  if [[ "$FILE" == *.ts || "$FILE" == *.tsx ]]; then
    npx tsc --noEmit --skipLibCheck 2>&1 | tail -5
  fi
fi
