#!/bin/bash
# Create 30 days of availability for both contractors

API_TOKEN="Bearer 2800605944a0f90a8a8cb1d463becf90e342788020c707a97463bbb12994c3d51bc69d0f4bd2b2dd58e783117c800f1bc20613b7b7fdbe6f0baa995cd05eba7bcd0e446d35aad5b02e7a4a0d9de71f3f825f65fb8742e127c059cb838afeff4eaf39822733e49995537fde49dc87a8c519c38b0956faebc991bad4990b25cb3e"

echo "🌱 Creating availability for next 30 days..."

for i in $(seq 0 29); do
    DATE=$(date -v+${i}d +%Y-%m-%d)
    DAY_OF_WEEK=$(date -v+${i}d +%u)  # 1=Mon, 7=Sun
    
    # Default availability for Contractor 1 (weekday morning/afternoon available, Sunday off)
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        TW1='{"morning":{"available":false,"booked":false},"afternoon":{"available":false,"booked":false},"evening":{"available":false,"booked":false}}'
    elif [ "$DAY_OF_WEEK" -eq 6 ]; then
        TW1='{"morning":{"available":true,"booked":false},"afternoon":{"available":false,"booked":false},"evening":{"available":false,"booked":false}}'
    else
        TW1='{"morning":{"available":true,"booked":false},"afternoon":{"available":true,"booked":false},"evening":{"available":false,"booked":false}}'
    fi
    
    # Contractor 2 availability - more flexible schedule
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        TW2='{"morning":{"available":false,"booked":false},"afternoon":{"available":false,"booked":false},"evening":{"available":false,"booked":false}}'
    elif [ "$DAY_OF_WEEK" -eq 6 ]; then
        TW2='{"morning":{"available":true,"booked":false},"afternoon":{"available":true,"booked":false},"evening":{"available":false,"booked":false}}'
    else
        TW2='{"morning":{"available":true,"booked":false},"afternoon":{"available":true,"booked":false},"evening":{"available":true,"booked":false}}'
    fi
    
    # Create for contractor 1
    RESULT=$(curl -s -X POST http://localhost:1337/api/contractor-availabilities \
        -H "Content-Type: application/json" \
        -H "Authorization: $API_TOKEN" \
        -d "{\"data\":{\"contractor\":1,\"date\":\"$DATE\",\"timeWindows\":$TW1}}")
    
    # Create for contractor 2
    RESULT2=$(curl -s -X POST http://localhost:1337/api/contractor-availabilities \
        -H "Content-Type: application/json" \
        -H "Authorization: $API_TOKEN" \
        -d "{\"data\":{\"contractor\":2,\"date\":\"$DATE\",\"timeWindows\":$TW2}}")
    
    echo "✓ $DATE"
done

echo ""
echo "✨ Done! Created availability records"
