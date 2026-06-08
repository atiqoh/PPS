API Tests for `lembur` controller (base path: /lembur)

1. Name: Check Schedule
- Method: POST
- URL: /lembur/check-schedule
- Query params: none
- Body (form-data / x-www-form-urlencoded):
  - id_pegawai: 1
  - tanggal_lembur: 2026-06-05
  - jam_mulai: 17:00
  - jam_selesai: 19:00
  - exclude_uid: (optional)
- Notes: returns conflict boolean and list of conflicts

2. Name: Create Lembur
- Method: POST
- URL: /lembur/
- Body (form-data / x-www-form-urlencoded):
  - id_pegawai: 1
  - tanggal_lembur: 2026-06-05
  - jam_mulai: 17:00
  - jam_selesai: 19:00
  - keterangan: "Lembur project"
  - status: (optional) "Menunggu Konfirmasi"
- Notes: creates a lembur record; `durasi` dihitung backend dalam menit

3. Name: List Lembur
- Method: GET
- URL: /lembur/
- Query params (optional):
  - limit: 10
  - page: 1
  - search: "Menunggu"
  - filter: (can be passed as JSON string or query object)
    - e.g. ?filter[id_pegawai]=1 or ?filter={"id_pegawai":1}
- Notes: returns paginated list

4. Name: Approve Lembur
- Method: PUT
- URL: /lembur/:id/approve
- Path params:
  - id: lembur uid (string)
- Body: none
- Notes: sets status to "Approved"

5. Name: Reject Lembur
- Method: PUT
- URL: /lembur/:id/reject
- Path params:
  - id: lembur uid (string)
- Body: none
- Notes: sets status to "Reject"

6. Name: Get Lembur Detail
- Method: GET
- URL: /lembur/:id
- Path params:
  - id: lembur uid (string)
- Body: none

7. Name: Update Lembur
- Method: PUT
- URL: /lembur/:id
- Path params:
  - id: lembur uid (string)
- Body (form-data / x-www-form-urlencoded): any updatable fields, e.g.
  - tanggal_lembur: 2026-06-06
  - jam_mulai: 18:00
  - jam_selesai: 20:00
  - keterangan: "Updated"
- Notes: update is allowed only when lembur.status is "Menunggu Konfirmasi"; `durasi` dihitung backend

8. Name: Delete Lembur
- Method: DELETE
- URL: /lembur/:id
- Path params:
  - id: lembur uid (string)
- Body: none

---

Base URL examples:
- Local: http://localhost:3000

Use full endpoint like: http://localhost:3000/lembur/check-schedule
