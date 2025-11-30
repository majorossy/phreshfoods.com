import csv
import os
import urllib.parse
import requests

API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")  # or paste directly if you prefer

if not API_KEY:
    raise SystemExit("Set GOOGLE_MAPS_API_KEY in your environment first")

places = [
    {
        "Name": "Sissle & Daughters",
        "Address": "107 Washington Ave Unit 1",
        "City": "Portland",
        "Zip": "04101",
        "Phone": "(207) 400-5344",
    },
    {
        "Name": "The Cheese Iron",
        "Address": "200 US Route 1 Suite 300",
        "City": "Scarborough",
        "Zip": "04074",
        "Phone": "(207) 883-4057",
    },
    {
        "Name": "Nibblesford Cheese Shop",
        "Address": "5 Washington St Suite 1",
        "City": "Biddeford",
        "Zip": "04005",
        "Phone": "(207) 710-2770",
    },
    {
        "Name": "Smiling Hill Farm (Dairy Store)",
        "Address": "781 County Rd",
        "City": "Westbrook",
        "Zip": "04092",
        "Phone": "(207) 775-4818",
    },
    {
        "Name": "Board. Wine & Cheese Bar",
        "Address": "5 Shapleigh Rd Suite 108",
        "City": "Kittery",
        "Zip": "03904",
        "Phone": "(207) 438-0300",
    },
    {
        "Name": "Galley Provisions (Charcuterie & Graze Tables)",
        "Address": "York",
        "City": "York",
        "Zip": "03909",
        "Phone": "",
    },
    {
        "Name": "Balfour Farm / The Little Cheese Shop",
        "Address": "461 Webb Rd",
        "City": "Pittsfield",
        "Zip": "04967",
        "Phone": "(207) 213-3159",
    },
    {
        "Name": "State of Maine Cheese Co. / Rockport Marketplace",
        "Address": "461 Commercial St (US Route 1)",
        "City": "Rockport",
        "Zip": "04856",
        "Phone": "(207) 236-8895",
    },
    {
        "Name": "Five Islands Farm (seasonal market)",
        "Address": "1375 Five Islands Rd",
        "City": "Georgetown",
        "Zip": "04548",
        "Phone": "(207) 371-9383",
    },
    {
        "Name": "Morning Glory Natural Foods (big wine & cheese selection)",
        "Address": "60 Maine St",
        "City": "Brunswick",
        "Zip": "04011",
        "Phone": "(207) 729-0546",
    },
    {
        "Name": "Portland Food Co-op",
        "Address": "290 Congress St",
        "City": "Portland",
        "Zip": "04101",
        "Phone": "(207) 805-1599",
    },
    {
        "Name": "Market at Pineland Farms",
        "Address": "15 Farm View Dr",
        "City": "New Gloucester",
        "Zip": "04260",
        "Phone": "(207) 688-4539",
    },
    {
        "Name": "Lakin's Gorges Cheese at East Forty Farm",
        "Address": "2361 Friendship Rd (Route 220 S)",
        "City": "Waldoboro",
        "Zip": "04572",
        "Phone": "(207) 230-4318",
    },
    {
        "Name": "Maine Tasting Center (tasting room & boards)",
        "Address": "506 Old Bath Rd",
        "City": "Wiscasset",
        "Zip": "04578",
        "Phone": "(207) 558-5772",
    },
    {
        "Name": "Noisy Acres Farm (goat cheese & farm store)",
        "Address": "145 Back Nippen Rd",
        "City": "Buxton",
        "Zip": "04093",
        "Phone": "(207) 608-1816",
    },
    {
        "Name": "Winter Hill Farm (farmstead creamery & stand)",
        "Address": "35 Hill Farm Rd",
        "City": "Freeport",
        "Zip": "04032",
        "Phone": "(207) 869-5122",
    },
    {
        "Name": "Broad Arrow Farm Market & Butcher / The Rooting Pig",
        "Address": "33 Benner Rd",
        "City": "Bristol",
        "Zip": "04539",
        "Phone": "(207) 553-0747",
    },
]

def find_place_id(entry):
    # Build a strong text query using name + full address
    text = f"{entry['Name']}, {entry['Address']}, {entry['City']} ME {entry['Zip']}"
    params = {
        "input": text,
        "inputtype": "textquery",
        "fields": "place_id,name,formatted_address",
        "key": API_KEY,
    }
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return ""
    # Take the top candidate
    return candidates[0].get("place_id", "")

output_rows = []
for p in places:
    pid = find_place_id(p)
    row = {
        "Name": p["Name"],
        "Address": p["Address"],
        "City": p["City"],
        "Zip": p["Zip"],
        "Place ID": pid,
        "Phone": p["Phone"],
    }
    output_rows.append(row)
    print(f"{p['Name']}: {pid}")

with open("maine_cheese_places_with_ids.csv", "w", newline="", encoding="utf-8") as f:
    fieldnames = ["Name", "Address", "City", "Zip", "Place ID", "Phone"]
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(output_rows)

print("Wrote maine_cheese_places_with_ids.csv")

