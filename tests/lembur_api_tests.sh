#!/usr/bin/env bash
BASE_URL=${BASE_URL:-http://localhost:3000}

echo "1) Check schedule"
curl -s -X POST "$BASE_URL/lembur/check-schedule" \
  -F "id_pegawai=1" \
  -F "tanggal_lembur=2026-06-05" \
  -F "jam_mulai=17:00" \
  -F "jam_selesai=19:00" | jq

echo "\n2) Create lembur"
curl -s -X POST "$BASE_URL/lembur/" \
  -F "id_pegawai=1" \
  -F "tanggal_lembur=2026-06-05" \
  -F "jam_mulai=17:00" \
  -F "jam_selesai=19:00" \
  -F "keterangan=Lembur project" | jq

# Replace UID below with actual uid returned from create or list
UID="REPLACE_UID"

echo "\n3) List lembur (first page)"
curl -s -X GET "$BASE_URL/lembur?limit=10&page=1" | jq

echo "\n4) Get lembur detail (replace UID)"
if [ "$UID" != "REPLACE_UID" ]; then
  curl -s -X GET "$BASE_URL/lembur/$UID" | jq
else
  echo "skipping detail (set UID variable)"
fi

echo "\n5) Update lembur (replace UID)"
if [ "$UID" != "REPLACE_UID" ]; then
  curl -s -X PUT "$BASE_URL/lembur/$UID" \
    -F "tanggal_lembur=2026-06-06" \
    -F "jam_mulai=18:00" \
    -F "jam_selesai=20:00" \
    -F "keterangan=Updated" | jq
else
  echo "skipping update (set UID variable)"
fi

echo "\n6) Approve lembur (replace UID)"
if [ "$UID" != "REPLACE_UID" ]; then
  curl -s -X PUT "$BASE_URL/lembur/$UID/approve" | jq
else
  echo "skipping approve (set UID variable)"
fi

echo "\n7) Reject lembur (replace UID)"
if [ "$UID" != "REPLACE_UID" ]; then
  curl -s -X PUT "$BASE_URL/lembur/$UID/reject" | jq
else
  echo "skipping reject (set UID variable)"
fi

echo "\n8) Delete lembur (replace UID)"
if [ "$UID" != "REPLACE_UID" ]; then
  curl -s -X DELETE "$BASE_URL/lembur/$UID" | jq
else
  echo "skipping delete (set UID variable)"
fi
