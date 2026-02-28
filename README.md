# Registered – ดูข้อมูล RegisterDB_2569

เว็บสำหรับดูข้อมูลในฐานข้อมูล **RegisterDB_2569** และ **OMODA** บน SQL Server

## โครงสร้างโปรเจกต์

- **Backend:** Python + FastAPI (API เท่านั้น)
- **Frontend:** React (Vite + React Router + Tailwind)

## สิ่งที่ต้องมี

- Python 3.10+
- Node.js 18+ (สำหรับ Frontend)
- SQL Server และฐานข้อมูล RegisterDB_2569, OMODA
- ODBC Driver 17 for SQL Server

## การติดตั้ง

### Backend (Python)

```bash
pip install -r requirements.txt
```

คัดลอก `.env.example` เป็น `.env` แล้วตั้งค่า `DATABASE_URL` และ `OMODA_DATABASE_URL` (ถ้าต้องการ)

### Frontend (React)

```bash
cd frontend
npm install
```

## การรัน

### โหมดพัฒนา (แยก Backend / Frontend)

1. **รัน Backend (พอร์ต 8000):**
   ```bash
   python app.py
   ```
   หรือ `uvicorn app:app --reload --port 8000`

2. **รัน Frontend (พอร์ต 5173):**
   ```bash
   cd frontend
   npm run dev
   ```

เปิดเบราว์เซอร์ที่ **http://localhost:5173**  
Frontend จะ proxy คำขอ `/api/*` ไปที่ Backend อัตโนมัติ

### โหมด Production (เสิร์ฟรวมจาก Backend)

1. Build Frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. รัน Backend:
   ```bash
   python app.py
   ```

เปิดเบราว์เซอร์ที่ **http://localhost:8000**  
Backend จะเสิร์ฟไฟล์ static ของ React จาก `frontend/dist` และ route ทั้งหมดที่ไม่ใช่ `/api` จะได้หน้า SPA

## ฟีเจอร์

- **สร้าง:** เลือกช่วงวันที่จดทะเบียน แล้วสร้างตาราง
- **ตารางข้อมูล:** แสดงรายการจดทะเบียน
- **ตรวจสอบสถานะตั้งเบิก:** แท็บ Claim Report (OMODA) และ ข้อมูลพนักงาน (ตาราง OFFICER) พร้อมโหลดข้อมูลและค้นหา

## API หลัก

- `GET /api/check-status/claim-report` – ดึง Claim Report จาก OMODA
- `GET /api/check-status/officer` – ดึงรายชื่อพนักงานจาก OMODA (OFFICER)
- `GET /api/tables` – รายชื่อตารางใน RegisterDB_2569
- `GET /api/table/{schema}/{table}` – ข้อมูลตาราง (แบ่งหน้าได้)
