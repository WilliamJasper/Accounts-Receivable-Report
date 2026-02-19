"""
Registered - Web viewer for SQL Server database RegisterDB_2569
Backend: Python + FastAPI
"""
import os
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import pyodbc

load_dotenv()

# ตารางประวัติการแก้ไข (ใน RegisterDB_2569)
EDIT_HISTORY_TABLE = "EditHistory"


def _ensure_edit_history_table():
    """สร้างตาราง EditHistory ถ้ายังไม่มี"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = N'EditHistory')
            CREATE TABLE EditHistory (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                EditedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                TableSchema NVARCHAR(128) NOT NULL,
                TableName NVARCHAR(128) NOT NULL,
                [Action] NVARCHAR(20) NOT NULL,
                RowKey NVARCHAR(500) NULL,
                ColumnName NVARCHAR(128) NULL,
                OldValue NVARCHAR(MAX) NULL,
                NewValue NVARCHAR(MAX) NULL
            )
        """)
        conn.commit()
    finally:
        conn.close()

app = FastAPI(title="Registered - RegisterDB_2569 Viewer")

BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

# Connection string สำหรับ RegisterDB_2569
def get_connection_string() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url
    # ค่าเริ่มต้นตรงกับ SQL Server ในภาพ
    return (
        "Driver={ODBC Driver 17 for SQL Server};"
        "Server=LAPTOP-2CN8L0R4\\SQLEXPRESS;"
        "Database=RegisterDB_2569;"
        "Trusted_Connection=yes;"
    )


def get_connection():
    return pyodbc.connect(get_connection_string())


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """หน้าแรกว่าง ๆ ก่อนเข้าสู่หน้าแสดงข้อมูล"""
    return templates.TemplateResponse("home.html", {"request": request})


@app.get("/viewer", response_class=HTMLResponse)
async def index(request: Request):
    """หน้าแสดงข้อมูลตารางใน RegisterDB_2569"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/data-table", response_class=HTMLResponse)
async def data_table(request: Request):
    """หน้าตารางข้อมูลจดทะเบียน (รูปแบบ 4 คอลัมน์: เลขที่ใบกำกับภาษี, ช่วงวันที่, ไฟแนนซ์, จังหวัดที่จดทะเบียน)"""
    return templates.TemplateResponse("data-table.html", {"request": request})


@app.get("/check-status", response_class=HTMLResponse)
async def check_status(request: Request):
    """หน้าตรวจสอบสถานะตั้งเบิก (placeholder รอคำสั่งถัดไป)"""
    return templates.TemplateResponse("check-status.html", {"request": request})


@app.get("/api/register/options")
async def get_register_options():
    """
    คืนค่าตัวเลือกสำหรับหน้าจดทะเบียน:
    - ประเภทไฟแนนซ์, จังหวัดที่จด, แบรนด์รถ (จาก dbo.RegisterReport_2569)
    """
    try:
        conn = get_connection()
        cur = conn.cursor()

        # ประเภทไฟแนนซ์ (ใช้ DISTINCT จากคอลัมน์ที่เกี่ยวข้อง ถ้าคอลัมน์ใดไม่มีจะถูกข้าม)
        finance_values: set[str] = set()
        for col_name in ["ไฟแนนซ์", "ชุดไฟแนนซ์"]:
            try:
                cur.execute(
                    f"""
                    SELECT DISTINCT [{col_name}]
                    FROM [dbo].[RegisterReport_2569]
                    WHERE [{col_name}] IS NOT NULL AND LTRIM(RTRIM([{col_name}])) <> ''
                    """
                )
                for (val,) in cur.fetchall():
                    finance_values.add(str(val).strip())
            except Exception:
                # ถ้าคอลัมน์นั้นไม่มี ให้ข้ามไป
                continue

        # จังหวัดที่จด
        province_values: list[str] = []
        try:
            cur.execute(
                """
                SELECT DISTINCT [จังหวัดที่จด]
                FROM [dbo].[RegisterReport_2569]
                WHERE [จังหวัดที่จด] IS NOT NULL AND LTRIM(RTRIM([จังหวัดที่จด])) <> ''
                ORDER BY [จังหวัดที่จด]
                """
            )
            province_values = [str(r[0]).strip() for r in cur.fetchall()]
        except Exception:
            province_values = []

        # แบรนด์รถ (ลองคอลัมน์ แบรนด์รถ หรือ ยี่ห้อ)
        car_brand_values: list[str] = []
        for col_name in ["แบรนด์รถ", "ยี่ห้อ"]:
            try:
                cur.execute(
                    f"""
                    SELECT DISTINCT [{col_name}]
                    FROM [dbo].[RegisterReport_2569]
                    WHERE [{col_name}] IS NOT NULL AND LTRIM(RTRIM([{col_name}])) <> ''
                    ORDER BY [{col_name}]
                    """
                )
                car_brand_values = [str(r[0]).strip() for r in cur.fetchall()]
                break
            except Exception:
                continue

        conn.close()
        finance_list = sorted(finance_values)

        return {
            "ok": True,
            "finance_types": finance_list,
            "provinces": province_values,
            "car_brands": car_brand_values,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/edit-history")
async def get_edit_history(
    table_name: str = Query(default="", description="กรองตามชื่อตาราง เช่น RegisterReport_2569"),
    limit: int = Query(default=200, ge=1, le=1000),
):
    """ดึงประวัติการแก้ไข (วันที่/เวลา, ตาราง, การดำเนินการ, รายละเอียด)"""
    _ensure_edit_history_table()
    try:
        conn = get_connection()
        cur = conn.cursor()
        if table_name and table_name.strip():
            cur.execute("""
                SELECT Id, EditedAt, TableSchema, TableName, [Action], RowKey, ColumnName, OldValue, NewValue
                FROM EditHistory
                WHERE TableName = ?
                ORDER BY EditedAt DESC
                OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
            """, (table_name.strip(), limit))
        else:
            cur.execute("""
                SELECT Id, EditedAt, TableSchema, TableName, [Action], RowKey, ColumnName, OldValue, NewValue
                FROM EditHistory
                ORDER BY EditedAt DESC
                OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY
            """, (limit,))
        rows = cur.fetchall()
        conn.close()
        history = []
        for r in rows:
            edited_at = r[1]
            if hasattr(edited_at, "isoformat"):
                edited_at = edited_at.isoformat()
            history.append({
                "id": r[0],
                "edited_at": edited_at,
                "table_schema": r[2],
                "table_name": r[3],
                "action": r[4],
                "row_key": r[5],
                "column_name": r[6],
                "old_value": r[7],
                "new_value": r[8],
            })
        return {"ok": True, "history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tables")
async def list_tables():
    """รายชื่อตารางใน RegisterDB_2569 (เฉพาะ user tables)"""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
        """)
        rows = cur.fetchall()
        conn.close()
        return {
            "ok": True,
            "tables": [
                {"schema": r[0], "name": r[1], "full_name": f"{r[0]}.{r[1]}"}
                for r in rows
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/table/{schema_name}/{table_name}")
async def get_table_data(
    schema_name: str,
    table_name: str,
    limit: int = Query(default=500, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
    startRegDate: str | None = Query(default=None),
    endRegDate: str | None = Query(default=None),
    financeType: str | None = Query(default=None),
    province: str | None = Query(default=None),
    carBrand: str | None = Query(default=None),
    statusFilter: str | None = Query(default=None),
):
    """ดึงข้อมูลและชื่อคอลัมน์ของตารางที่เลือก (รองรับ pagination)"""
    # ป้องกัน SQL injection - ใช้ชื่อที่มาจาก INFORMATION_SCHEMA เท่านั้น
    safe_schema = schema_name.replace("]", "]]")
    safe_table = table_name.replace("]", "]]")
    try:
        conn = get_connection()
        cur = conn.cursor()

        # ดึงชื่อคอลัมน์
        cur.execute("""
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        """, (schema_name, table_name))
        columns = [{"name": r[0], "type": r[1]} for r in cur.fetchall()]

        # เรียงคอลัมน์ให้ แบรนด์รถ อยู่ก่อน รุ่น (ลองทั้ง แบรนด์รถ และ ยี่ห้อ)
        if schema_name == "dbo" and table_name == "RegisterReport_2569":
            col_names = [c["name"] for c in columns]
            brand_col = "แบรนด์รถ" if "แบรนด์รถ" in col_names else ("ยี่ห้อ" if "ยี่ห้อ" in col_names else None)
            if brand_col and "รุ่น" in col_names:
                new_columns = []
                for c in columns:
                    if c["name"] == brand_col:
                        continue
                    if c["name"] == "รุ่น":
                        new_columns.append(next(x for x in columns if x["name"] == brand_col))
                    new_columns.append(c)
                columns = new_columns

        if not columns:
            conn.close()
            raise HTTPException(status_code=404, detail="ไม่พบตารางหรือไม่มีคอลัมน์")

        col_list = ", ".join([f"[{c['name'].replace(']', ']]')}]" for c in columns])
        full_name = f"[{safe_schema}].[{safe_table}]"

        # เงื่อนไขกรองพิเศษสำหรับตาราง RegisterReport_2569
        where_clauses: list[str] = []
        params: list = []
        if schema_name == "dbo" and table_name == "RegisterReport_2569":
            where_clauses, params = _register_report_where_clauses(
                startRegDate, endRegDate, financeType, province, statusFilter
            )
            # กรองแบรนด์รถ (ใช้คอลัมน์ที่มีในตาราง)
            if carBrand and str(carBrand).strip():
                col_names = [c["name"] for c in columns]
                if "แบรนด์รถ" in col_names:
                    where_clauses.append("LTRIM(RTRIM([แบรนด์รถ])) = ?")
                    params.append(str(carBrand).strip())
                elif "ยี่ห้อ" in col_names:
                    where_clauses.append("LTRIM(RTRIM([ยี่ห้อ])) = ?")
                    params.append(str(carBrand).strip())

        where_sql = ""
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)

        order_sql = " ORDER BY (SELECT NULL)"
        if schema_name == "dbo" and table_name == "RegisterReport_2569":
            if any(c["name"] == "วันที่จด" for c in columns):
                order_sql = " ORDER BY [วันที่จด]"

        # นับจำนวนแถวทั้งหมด (ตามเงื่อนไข where ถ้ามี)
        cur.execute(f"SELECT COUNT(*) FROM {full_name}{where_sql}", params)
        total_rows = cur.fetchone()[0]

        # ดึงข้อมูลแบบมี offset/limit
        sql = f"SELECT {col_list} FROM {full_name}{where_sql}{order_sql} OFFSET ? ROWS FETCH NEXT ? ROWS ONLY"
        cur.execute(sql, params + [offset, limit])
        rows = cur.fetchall()
        conn.close()

        # แปลงเป็น list of dict
        column_names = [c["name"] for c in columns]
        data = []
        for row in rows:
            record = {}
            for i, val in enumerate(row):
                if val is None:
                    record[column_names[i]] = None
                elif hasattr(val, "isoformat"):  # datetime
                    record[column_names[i]] = val.isoformat()
                else:
                    record[column_names[i]] = val
            data.append(record)

        # ดึง Primary Key ของตาราง (สำหรับปุ่ม Import = UPDATE)
        conn2 = get_connection()
        try:
            cur2 = conn2.cursor()
            cur2.execute("""
                SELECT c.COLUMN_NAME
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c
                  ON tc.CONSTRAINT_NAME = c.CONSTRAINT_NAME
                 AND tc.TABLE_SCHEMA = c.TABLE_SCHEMA
                 AND tc.TABLE_NAME = c.TABLE_NAME
                WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ?
                  AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ORDER BY c.ORDINAL_POSITION
            """, (schema_name, table_name))
            primary_key = [r[0] for r in cur2.fetchall()]
        except Exception:
            primary_key = []
        finally:
            conn2.close()
        if not primary_key and "Id" in column_names:
            primary_key = ["Id"]

        return {
            "ok": True,
            "schema": schema_name,
            "table": table_name,
            "columns": columns,
            "data": data,
            "total_rows": total_rows,
            "limit": limit,
            "offset": offset,
            "primary_key": primary_key,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _register_report_where_clauses(
    startRegDate: str | None,
    endRegDate: str | None,
    financeType: str | None,
    province: str | None,
    statusFilter: str | None = None,
) -> tuple[list[str], list]:
    """สร้าง where_clauses และ params สำหรับตาราง RegisterReport_2569 (ใช้กับ SELECT และ DELETE)"""
    where_clauses: list[str] = []
    params: list = []
    if statusFilter and str(statusFilter).strip():
        where_clauses.append("LTRIM(RTRIM([สถานะ])) = ?")
        params.append(str(statusFilter).strip())
    start_ok = startRegDate and startRegDate.strip()
    end_ok = endRegDate and endRegDate.strip()
    start_val = startRegDate.strip()[:10] if start_ok else ""
    end_val = endRegDate.strip()[:10] if end_ok else ""
    if start_ok and end_ok and start_val > end_val:
        start_val, end_val = end_val, start_val
    if start_ok and end_ok:
        where_clauses.append(
            "( (CAST([วันที่จด] AS DATE) >= CAST(? AS DATE) AND CAST([วันที่จด] AS DATE) <= CAST(? AS DATE)) "
            "OR ([วันที่จด] IS NULL AND CAST([วันที่ใบกำกับภาษี] AS DATE) >= CAST(? AS DATE) AND CAST([วันที่ใบกำกับภาษี] AS DATE) <= CAST(? AS DATE)) )"
        )
        params.extend([start_val, end_val, start_val, end_val])
    elif start_ok:
        where_clauses.append(
            "( CAST([วันที่จด] AS DATE) >= CAST(? AS DATE) OR ([วันที่จด] IS NULL AND CAST([วันที่ใบกำกับภาษี] AS DATE) >= CAST(? AS DATE)) )"
        )
        params.extend([startRegDate.strip()[:10], startRegDate.strip()[:10]])
    elif end_ok:
        where_clauses.append(
            "( CAST([วันที่จด] AS DATE) <= CAST(? AS DATE) OR ([วันที่จด] IS NULL AND CAST([วันที่ใบกำกับภาษี] AS DATE) <= CAST(? AS DATE)) )"
        )
        params.extend([endRegDate.strip()[:10], endRegDate.strip()[:10]])

    if financeType and financeType.strip():
        where_clauses.append("([ไฟแนนซ์] = ? OR [ชุดไฟแนนซ์] = ?)")
        params.append(financeType.strip())
        params.append(financeType.strip())

    if province and province.strip():
        p = province.strip()
        if p in ("กทม.", "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร"):
            where_clauses.append("( LTRIM(RTRIM([จังหวัดที่จด])) IN (?, ?, ?, ?) )")
            params.extend(["กทม.", "กรุงเทพ", "กรุงเทพฯ", "กรุงเทพมหานคร"])
        else:
            where_clauses.append("LTRIM(RTRIM([จังหวัดที่จด])) = ?")
            params.append(p)
    return where_clauses, params


@app.post("/api/table/dbo/RegisterReport_2569/delete-by-filter")
async def delete_register_report_by_filter(request: Request):
    """ลบแถวใน RegisterReport_2569 ตามเงื่อนไขกรอง (ช่วงวันที่, ไฟแนนซ์, จังหวัด)"""
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ JSON ไม่ถูกต้อง")
    startRegDate = (body.get("startRegDate") or "").strip()[:10] if body.get("startRegDate") else None
    endRegDate = (body.get("endRegDate") or "").strip()[:10] if body.get("endRegDate") else None
    financeType = (body.get("financeType") or "").strip() or None
    province = (body.get("province") or "").strip() or None
    carBrand = (body.get("carBrand") or "").strip() or None

    where_clauses, params = _register_report_where_clauses(startRegDate, endRegDate, financeType, province)
    # กรองแบรนด์รถ (ต้องมี columns จาก table - ใช้การเช็คจาก INFORMATION_SCHEMA)
    if carBrand:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' AND TABLE_NAME='RegisterReport_2569' AND COLUMN_NAME IN ('แบรนด์รถ','ยี่ห้อ')"
        )
        brand_cols = [r[0] for r in cur.fetchall()]
        conn.close()
        if brand_cols:
            col = brand_cols[0]
            where_clauses.append(f"LTRIM(RTRIM([{col}])) = ?")
            params.append(carBrand)
    if not where_clauses:
        raise HTTPException(status_code=400, detail="ต้องระบุเงื่อนไขกรองอย่างน้อยหนึ่งอย่าง (วันที่/ไฟแนนซ์/จังหวัด)")

    full_name = "[dbo].[RegisterReport_2569]"
    where_sql = " WHERE " + " AND ".join(where_clauses)
    delete_sql = f"DELETE FROM {full_name}{where_sql}"

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(delete_sql, params)
        deleted = cur.rowcount
        conn.commit()
        conn.close()
        return {"ok": True, "deleted": deleted, "message": f"ลบ {deleted} แถวเรียบร้อยแล้ว"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/table/{schema_name}/{table_name}/import")
async def import_rows(schema_name: str, table_name: str, request: Request):
    """นำเข้าแถวที่เพิ่มจากตารางแก้ไขลงตารางในฐานข้อมูล"""
    try:
        body = await request.json()
        rows = body.get("rows") or []
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ JSON ไม่ถูกต้อง")

    if not rows or not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="ไม่มีแถวสำหรับนำเข้า")

    safe_schema = schema_name.replace("]", "]]")
    safe_table = table_name.replace("]", "]]")
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        """, (schema_name, table_name))
        columns = [{"name": r[0], "type": r[1]} for r in cur.fetchall()]
        if not columns:
            conn.close()
            raise HTTPException(status_code=404, detail="ไม่พบตาราง")

        col_names = [c["name"] for c in columns]
        full_name = f"[{safe_schema}].[{safe_table}]"
        placeholders = ", ".join(["?"] * len(col_names))
        col_list = ", ".join([f"[{c.replace(']', ']]')}]" for c in col_names])
        insert_sql = f"INSERT INTO {full_name} ({col_list}) VALUES ({placeholders})"

        inserted = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            values = []
            for col in col_names:
                val = row.get(col)
                if val is None or (isinstance(val, str) and val.strip() == ""):
                    values.append(None)
                else:
                    values.append(str(val).strip() if isinstance(val, str) else val)
            if len(values) != len(col_names):
                continue
            try:
                cur.execute(insert_sql, values)
                inserted += 1
            except Exception:
                pass
        conn.commit()
        conn.close()
        return {"ok": True, "rows_inserted": inserted, "message": f"นำเข้า {inserted} แถวเรียบร้อยแล้ว"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# คอลัมน์ที่อนุญาตให้แก้ไขในตารางหลัก (Import = UPDATE แถวเดิมเท่านั้น)
EDITABLE_COLUMNS = [
    "สถานะ", "ทะเบียน", "วันที่จด", "หมายเหตุ", "แจ้งจำหน่าย",
    "พรบ", "ชุดไฟแนนซ์", "ปิดแฟ้ม", "จังหวัดที่จด", "เบอร์ติดต่อ",
    "วันที่รับแจ้งจำหน่าย", "ชุดครบ",
]


def _get_primary_key(schema_name: str, table_name: str) -> list:
    """ดึงชื่อคอลัมน์ Primary Key ของตาราง"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.COLUMN_NAME
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
            JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE c
              ON tc.CONSTRAINT_NAME = c.CONSTRAINT_NAME
             AND tc.TABLE_SCHEMA = c.TABLE_SCHEMA
             AND tc.TABLE_NAME = c.TABLE_NAME
            WHERE tc.TABLE_SCHEMA = ? AND tc.TABLE_NAME = ?
              AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ORDER BY c.ORDINAL_POSITION
        """, (schema_name, table_name))
        pk = [r[0] for r in cur.fetchall()]
    finally:
        conn.close()
    if not pk:
        # fallback ถ้าตารางไม่มี PK ประกาศ อาจใช้ Id
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = 'Id'
        """, (schema_name, table_name))
        if cur.fetchone():
            pk = ["Id"]
        conn.close()
    return pk


@app.post("/api/table/{schema_name}/{table_name}/update")
async def update_rows(schema_name: str, table_name: str, request: Request):
    """อัปเดตแถวเดิมในฐานข้อมูล (แก้เฉพาะคอลัมน์ที่อนุญาต) ไม่สร้างแถวใหม่"""
    try:
        body = await request.json()
        rows = body.get("rows") or []
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ JSON ไม่ถูกต้อง")

    if not rows or not isinstance(rows, list):
        raise HTTPException(status_code=400, detail="ไม่มีแถวสำหรับอัปเดต")

    safe_schema = schema_name.replace("]", "]]")
    safe_table = table_name.replace("]", "]]")
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        """, (schema_name, table_name))
        all_columns = [r[0] for r in cur.fetchall()]
        if not all_columns:
            conn.close()
            raise HTTPException(status_code=404, detail="ไม่พบตาราง")

        pk_cols = _get_primary_key(schema_name, table_name)
        if not pk_cols:
            conn.close()
            raise HTTPException(status_code=400, detail="ตารางไม่มี Primary Key ไม่สามารถอัปเดตได้")

        # เฉพาะคอลัมน์ที่อนุญาตและมีจริงในตาราง
        set_columns = [c for c in EDITABLE_COLUMNS if c in all_columns]
        if not set_columns:
            conn.close()
            return {"ok": True, "rows_updated": 0, "message": "ไม่มีคอลัมน์ที่แก้ไขได้ในตารางนี้"}

        full_name = f"[{safe_schema}].[{safe_table}]"
        set_clause = ", ".join([f"[{c.replace(']', ']]')}] = ?" for c in set_columns])
        where_clause = " AND ".join([f"[{c.replace(']', ']]')}] = ?" for c in pk_cols])
        update_sql = f"UPDATE {full_name} SET {set_clause} WHERE {where_clause}"

        updated = 0
        for row in rows:
            if not isinstance(row, dict):
                continue
            # ต้องมีค่าของ PK ทุกตัว
            pk_vals = [row.get(k) for k in pk_cols]
            if any(v is None or (isinstance(v, str) and str(v).strip() == "") for v in pk_vals):
                continue
            set_vals = []
            for c in set_columns:
                v = row.get(c)
                if v is None or (isinstance(v, str) and v.strip() == ""):
                    set_vals.append(None)
                else:
                    set_vals.append(str(v).strip() if isinstance(v, str) else v)
            try:
                cur.execute(update_sql, set_vals + pk_vals)
                if cur.rowcount > 0:
                    updated += 1
            except Exception:
                pass
        conn.commit()
        conn.close()
        return {"ok": True, "rows_updated": updated, "message": f"อัปเดต {updated} แถวในฐานข้อมูลเรียบร้อยแล้ว"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/table/{schema_name}/{table_name}/row")
async def delete_row(schema_name: str, table_name: str, request: Request):
    """ลบหนึ่งแถวตาม Primary Key (ส่ง key เป็น JSON ใน body)"""
    try:
        body = await request.json()
        if not body or not isinstance(body, dict):
            raise HTTPException(status_code=400, detail="ส่ง key ของแถว (object) มาใน body")
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ JSON ไม่ถูกต้อง")

    pk_cols = _get_primary_key(schema_name, table_name)
    if not pk_cols and schema_name == "dbo" and table_name == "RegisterReport_2569":
        pk_cols = ["เลขที่ใบกำกับภาษี"]
    if not pk_cols:
        raise HTTPException(status_code=400, detail="ตารางไม่มี Primary Key ไม่สามารถลบได้")

    key_vals = []
    for col in pk_cols:
        v = body.get(col)
        if v is None or (isinstance(v, str) and str(v).strip() == ""):
            raise HTTPException(status_code=400, detail=f"ต้องส่งค่า Primary Key '{col}'")
        key_vals.append(str(v).strip() if isinstance(v, str) else v)

    safe_schema = schema_name.replace("]", "]]")
    safe_table = table_name.replace("]", "]]")
    full_name = f"[{safe_schema}].[{safe_table}]"
    where_clause = " AND ".join([f"[{c.replace(']', ']]')}] = ?" for c in pk_cols])
    delete_sql = f"DELETE FROM {full_name} WHERE {where_clause}"

    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(delete_sql, key_vals)
        deleted = cur.rowcount
        conn.commit()
        conn.close()
        return {"ok": True, "deleted": deleted, "message": "ลบแถวเรียบร้อยแล้ว" if deleted else "ไม่พบแถวที่ตรงกับ key"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _record_edit_history(cur, schema_name: str, table_name: str, action: str, row_key: str, column_name: str, old_value, new_value):
    """บันทึกหนึ่งรายการลง EditHistory"""
    _ensure_edit_history_table()
    old_str = None if old_value is None else str(old_value)
    new_str = None if new_value is None else str(new_value)
    cur.execute("""
        INSERT INTO EditHistory (EditedAt, TableSchema, TableName, [Action], RowKey, ColumnName, OldValue, NewValue)
        VALUES (GETDATE(), ?, ?, ?, ?, ?, ?, ?)
    """, (schema_name, table_name, action, row_key, column_name, old_str, new_str))


@app.post("/api/table/{schema_name}/{table_name}/import-update")
async def import_and_update_rows(schema_name: str, table_name: str, request: Request):
    """UPDATE แถวเดิม + บันทึกประวัติการแก้ไข (สำหรับ Import ลงฐานข้อมูล)"""
    try:
        body = await request.json()
        new_rows = body.get("new_rows") or []
        existing_rows = body.get("existing_rows") or []
    except Exception:
        raise HTTPException(status_code=400, detail="รูปแบบ JSON ไม่ถูกต้อง")

    safe_schema = schema_name.replace("]", "]]")
    safe_table = table_name.replace("]", "]]")
    try:
        conn = get_connection()
        cur = conn.cursor()
        _ensure_edit_history_table()

        cur.execute("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
        """, (schema_name, table_name))
        all_columns = [r[0] for r in cur.fetchall()]
        if not all_columns:
            conn.close()
            raise HTTPException(status_code=404, detail="ไม่พบตาราง")

        pk_cols = _get_primary_key(schema_name, table_name)
        full_name = f"[{safe_schema}].[{safe_table}]"

        # 1. INSERT แถวใหม่ (ถ้ามี)
        inserted = 0
        if new_rows:
            col_list = ", ".join([f"[{c.replace(']', ']]')}]" for c in all_columns])
            placeholders = ", ".join(["?"] * len(all_columns))
            insert_sql = f"INSERT INTO {full_name} ({col_list}) VALUES ({placeholders})"
            for row in new_rows:
                if not isinstance(row, dict):
                    continue
                values = []
                for col in all_columns:
                    val = row.get(col)
                    if val is None or (isinstance(val, str) and val.strip() == ""):
                        values.append(None)
                    else:
                        values.append(str(val).strip() if isinstance(val, str) else val)
                if len(values) == len(all_columns):
                    try:
                        cur.execute(insert_sql, values)
                        inserted += 1
                        row_key = str(values[all_columns.index(pk_cols[0])]) if pk_cols and pk_cols[0] in all_columns else ""
                        _record_edit_history(cur, schema_name, table_name, "INSERT", row_key, "(เพิ่มแถว)", None, str(row)[:2000])
                    except Exception:
                        pass

        # 2. UPDATE แถวเดิม + บันทึกประวัติ
        updated = 0
        if existing_rows and pk_cols:
            set_columns = [c for c in EDITABLE_COLUMNS if c in all_columns]
            if set_columns:
                col_list = ", ".join([f"[{c.replace(']', ']]')}]" for c in all_columns])
                select_sql = f"SELECT {col_list} FROM {full_name} WHERE " + " AND ".join([f"[{c.replace(']', ']]')}] = ?" for c in pk_cols])
                set_clause = ", ".join([f"[{c.replace(']', ']]')}] = ?" for c in set_columns])
                where_clause = " AND ".join([f"[{c.replace(']', ']]')}] = ?" for c in pk_cols])
                update_sql = f"UPDATE {full_name} SET {set_clause} WHERE {where_clause}"
                for row in existing_rows:
                    if not isinstance(row, dict):
                        continue
                    pk_vals = [row.get(k) for k in pk_cols]
                    if any(v is None or (isinstance(v, str) and str(v).strip() == "") for v in pk_vals):
                        continue
                    row_key = " | ".join(str(v) for v in pk_vals)
                    try:
                        cur.execute(select_sql, pk_vals)
                        old_row = cur.fetchone()
                        if old_row:
                            old_vals = {all_columns[i]: old_row[i] for i in range(len(all_columns))}
                            set_vals = []
                            for c in set_columns:
                                v = row.get(c)
                                new_val = None if (v is None or (isinstance(v, str) and v.strip() == "")) else (str(v).strip() if isinstance(v, str) else v)
                                old_val = old_vals.get(c)
                                if old_val is not None and hasattr(old_val, "isoformat"):
                                    old_val = old_val.isoformat()
                                if str(old_val or "") != str(new_val or ""):
                                    _record_edit_history(cur, schema_name, table_name, "UPDATE", row_key, c, old_val, new_val)
                                set_vals.append(new_val)
                            cur.execute(update_sql, set_vals + pk_vals)
                            if cur.rowcount > 0:
                                updated += 1
                    except Exception:
                        pass

        conn.commit()
        conn.close()
        msg_parts = []
        if inserted > 0:
            msg_parts.append(f"เพิ่ม {inserted} แถวใหม่")
        if updated > 0:
            msg_parts.append(f"อัปเดต {updated} แถว")
        message = "อัปโหลดฐานข้อมูลเรียบร้อยแล้ว" + (" (" + ", ".join(msg_parts) + ")" if msg_parts else "")
        return {"ok": True, "rows_inserted": inserted, "rows_updated": updated, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
