# Registered – ดูข้อมูล RegisterDB_2569

เว็บสำหรับดูข้อมูลในฐานข้อมูล **RegisterDB_2569** บน SQL Server (เช่น ตาราง `dbo.RegisterReport_2569`)

## สิ่งที่ต้องมี

- Python 3.10+
- SQL Server (เช่น LAPTOP-2CN8L0R4\SQLEXPRESS) และฐานข้อมูล RegisterDB_2569
- ODBC Driver 17 for SQL Server

## การติดตั้งและรัน

```bash
cd "c:\Users\Asus\Downloads\Registered"
pip install -r requirements.txt
```

ถ้าไม่ใช้ไฟล์ `.env` แอปจะใช้การเชื่อมต่อแบบ Trusted Connection ไปที่ `LAPTOP-2CN8L0R4\SQLEXPRESS` และฐานข้อมูล `RegisterDB_2569` โดยตรง

ถ้าต้องการกำหนด connection เอง คัดลอก `.env.example` เป็น `.env` แล้วแก้ `DATABASE_URL` ให้ตรงกับเครื่องคุณ:

```
DATABASE_URL=Driver={ODBC Driver 17 for SQL Server};Server=LAPTOP-2CN8L0R4\SQLEXPRESS;Database=RegisterDB_2569;Trusted_Connection=yes;
```

จากนั้นรันแอป:

```bash
python app.py
```

เปิดเบราว์เซอร์ที่: **http://localhost:8000**

## ฟีเจอร์

- แสดงรายชื่อตารางใน RegisterDB_2569
- เลือกตาราง (เช่น dbo.RegisterReport_2569) แล้วกดโหลดข้อมูล
- แสดงข้อมูลแบบแบ่งหน้า (ก่อนหน้า / ถัดไป)
