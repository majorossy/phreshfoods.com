#!/usr/bin/env bash

echo ">>> Script starting..."

# Fail fast on errors / undefined vars
set -euo pipefail

API_KEY="${GOOGLE_MAPS_API_KEY:-}"

if [[ -z "$API_KEY" ]]; then
  echo "ERROR: Please set GOOGLE_MAPS_API_KEY in your environment." >&2
  exit 1
fi

# Check jq
if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is not installed. Install it with: brew install jq" >&2
  exit 1
fi

OUTPUT_FILE="maine_cheese_places_with_ids.csv"

echo ">>> Writing CSV to: ${OUTPUT_FILE}"

# Header
printf '"Name","Address","City","Zip","Place ID","Phone"\n' > "$OUTPUT_FILE"

# Loop over inline data: Name|Address|City|Zip|Phone
while IFS='|' read -r name address city zip phone; do
  # Skip header/blank lines
  [[ -z "$name" || "$name" == "Name" ]] && continue

  query="${name}, ${address}, ${city} ME ${zip}"

  echo ">>> Looking up: ${query}" >&2

  response=$(curl -sS --get "https://maps.googleapis.com/maps/api/place/findplacefromtext/json" \
    --data-urlencode "input=${query}" \
    --data-urlencode "inputtype=textquery" \
    --data-urlencode "fields=place_id,name,formatted_address" \
    --data-urlencode "key=${API_KEY}")

  status=$(echo "$response" | jq -r '.status // ""')

  if [[ "$status" != "OK" ]]; then
    echo "    -> No match (status: $status)" >&2
    place_id=""
  else
    place_id=$(echo "$response" | jq -r '.candidates[0].place_id // ""')
    echo "    -> Place ID: $place_id" >&2
  fi

  printf '"%s","%s","%s","%s","%s","%s"\n' \
    "$name" "$address" "$city" "$zip" "$place_id" "$phone" >> "$OUTPUT_FILE"

done <<'DATA'
Name|Address|City|Zip|Phone
Sissle & Daughters|107 Washington Ave Unit 1|Portland|04101|(207) 400-5344
The Cheese Iron|200 US Route 1 Suite 300|Scarborough|04074|(207) 883-4057
Nibblesford Cheese Shop|5 Washington St Suite 1|Biddeford|04005|(207) 710-2770
Smiling Hill Farm (Dairy Store)|781 County Rd|Westbrook|04092|(207) 775-4818
Board. Wine & Cheese Bar|5 Shapleigh Rd Suite 108|Kittery|03904|(207) 438-0300
Galley Provisions (Charcuterie & Graze Tables)|York|York|03909|
Balfour Farm / The Little Cheese Shop|461 Webb Rd|Pittsfield|04967|(207) 213-3159
State of Maine Cheese Co. / Rockport Marketplace|461 Commercial St (US Route 1)|Rockport|04856|(207) 236-8895
Five Islands Farm (seasonal market)|1375 Five Islands Rd|Georgetown|04548|(207) 371-9383
Morning Glory Natural Foods (big wine & cheese selection)|60 Maine St|Brunswick|04011|(207) 729-0546
Portland Food Co-op|290 Congress St|Portland|04101|(207) 805-1599
Market at Pineland Farms|15 Farm View Dr|New Gloucester|04260|(207) 688-4539
Lakin's Gorges Cheese at East Forty Farm|2361 Friendship Rd (Route 220 S)|Waldoboro|04572|(207) 230-4318
Maine Tasting Center (tasting room & boards)|506 Old Bath Rd|Wiscasset|04578|(207) 558-5772
Noisy Acres Farm (goat cheese & farm store)|145 Back Nippen Rd|Buxton|04093|(207) 608-1816
Winter Hill Farm (farmstead creamery & stand)|35 Hill Farm Rd|Freeport|04032|(207) 869-5122
Broad Arrow Farm Marke

