#!/bin/bash

# Batch OCR script for thesis pages with rate limit handling
# Processes pages one at a time with delays

PAGES="13 16 19 23 24"
PROMPT="You are an expert OCR system for Arabic and Russian engineering documents. This is a scanned page from a thesis about تحصين protective structures and blast pressure calculations. Read EVERY line from top to bottom. Extract ALL text verbatim. Write ALL equations in LaTeX notation. Reproduce ALL tables with exact row/column values. Include all footnotes, annotations, and page numbers. Do NOT skip, summarize, or hallucinate content. Be thorough and complete - output everything visible on the page."

OUTPUT_DIR="/home/z/my-project/download/thesis_pages/ocr_results"
mkdir -p "$OUTPUT_DIR"

for i in $PAGES; do
  OUTPUT_FILE="$OUTPUT_DIR/page_${i}_ocr.txt"
  IMAGE="/home/z/my-project/download/thesis_pages/page_${i}_s.png"
  
  echo "=== Processing page $i ===" 
  
  attempt=0
  max_attempts=5
  success=false
  
  while [ $attempt -lt $max_attempts ]; do
    echo "Attempt $((attempt+1)) for page $i..."
    
    result=$(z-ai vision -p "$PROMPT" -i "$IMAGE" 2>&1)
    
    if echo "$result" | rg -q "429"; then
      wait_time=$((60 + attempt * 30))
      echo "Rate limited. Waiting ${wait_time}s before retry..."
      sleep $wait_time
      attempt=$((attempt+1))
    elif echo "$result" | rg -q "Error"; then
      echo "Other error. Waiting 30s before retry..."
      sleep 30
      attempt=$((attempt+1))
    else
      echo "$result" > "$OUTPUT_FILE"
      echo "SUCCESS: Page $i saved to $OUTPUT_FILE"
      success=true
      break
    fi
  done
  
  if [ "$success" = false ]; then
    echo "FAILED: Page $i after $max_attempts attempts" > "$OUTPUT_FILE"
  fi
  
  # Wait between pages to avoid rate limiting
  echo "Waiting 20s before next page..."
  sleep 20
done

echo "=== Batch OCR complete ==="
