"""
Registered - Web viewer for SQL Server database RegisterDB_2569
Backend: Python + FastAPI (API only; frontend = React)
"""
import os
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

app = FastAPI(title="Commission System - RegisterDB_2569 Viewer")

# CORS สำหรับ Frontend (React) ที่รันคนละ origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

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


def get_omoda_connection_string() -> str:
    """Connection string สำหรับ OMODA (หน้าตรวจสอบสถานะตั้งเบิก)"""
    url = os.getenv("OMODA_DATABASE_URL", "").strip()
    if url:
        return url
    return (
        "Driver={ODBC Driver 17 for SQL Server};"
        "Server=LAPTOP-2CN8L0R4\\SQLEXPRESS;"
        "Database=OMODA;"
        "Trusted_Connection=yes;"
    )


def get_omoda_connection():
    return pyodbc.connect(get_omoda_connection_string())


# SQL สำหรับ Claim Report จาก OMODA (JOB + CN + RETURN)
# ใช้โครงเดียวกับ query ใน SSMS และเพิ่มทั้งชื่อคอลัมน์อังกฤษ/ไทย (สำหรับ Frontend + งานเอกสาร)
CLAIM_REPORT_SQL = """
SELECT 
    XX.*,
    CAST(ROUND(XX.TOTALNET,2) AS decimal(18,2)) AS [มูลค่าก่อนVAT],
    CAST(ROUND(XX.TOTALNET * ISNULL(XX.VAT,0) / 100.0,2) AS decimal(18,2)) AS [ภาษี],
    CAST(ROUND(
        XX.TOTALNET + (XX.TOTALNET * ISNULL(XX.VAT,0) / 100.0)
    ,2) AS decimal(18,2)) AS [ยอดรวมภาษี],
    B.NAME1,
    B.NAME2,
    (B.NAME1+' '+B.NAME2) AS CUSNAM
FROM (
    /* 1. JOB */
    SELECT
        A.JOBNO, A.TAXNO, A.TAXDATE, A.JOBDATE, A.JOBTYP,
        CASE WHEN (A.TAXNO='' OR A.TAXNO IS NULL) THEN A.CUSCOD ELSE C.CUSCOD END AS CUSCOD,
        A.MDLCOD, A.STRNO, A.RLKILOMT, A.CAMPNO, A.STATUS, A.CLAIM,
        SUM(A.SERVAMT) AS SERVNET, SUM(A.OILAMT) AS OILNET, SUM(A.OUTAMT) AS OUTNET,
        SUM(A.COLAMT) AS COLRNET, SUM(A.PATAMT) AS PARTNET,
        SUM(A.SERVAMT+A.OILAMT+A.OUTAMT+A.COLAMT+A.PATAMT) AS TOTALNET,
        SUM(A.COS_SV) AS SERVCOS, SUM((FLOOR(A.COS_OL*100))/100) AS OILCOS,
        SUM(A.COS_OU) AS OUTCOS, SUM(A.COS_CO) AS COLRCOS, SUM((FLOOR(A.COS_PT*100))/100) AS PARTCOS,
        SUM(A.COS_SV+((FLOOR(A.COS_OL*100))/100)+A.COS_OU+A.COS_CO+((FLOOR(A.COS_PT*100))/100)) AS TOTALCOS,
        SUM(A.SERVAMT-A.COS_SV) AS SERVPRF, SUM(A.OILAMT-((FLOOR(A.COS_OL*100))/100)) AS OILPRF,
        SUM(A.OUTAMT-A.COS_OU) AS OUTPRF, SUM(A.COLAMT-A.COS_CO) AS COLRPRF,
        SUM(A.PATAMT-((FLOOR(A.COS_PT*100))/100)) AS PARTPRF,
        SUM((A.SERVAMT+A.OILAMT+A.OUTAMT+A.COLAMT+A.PATAMT)-(A.COS_SV+((FLOOR(A.COS_OL*100))/100)+A.COS_OU+A.COS_CO+((FLOOR(A.COS_PT*100))/100))) AS TOTALPRF,
        C.Paytyp AS PTYPE, R.REGNO,
        CASE WHEN D.VATTYPE IS NOT NULL THEN D.VATTYPE ELSE E.VATTYPE END AS VATTYPE,
        CASE WHEN D.VAT IS NOT NULL THEN D.VAT ELSE E.VAT END AS VAT, '1' AS FLAG, D.CLAIMTYP
    FROM VIEW_ANALYS01 A
    LEFT JOIN L_TAXSAL C ON A.TAXNO=C.TAXNO
    LEFT JOIN L_OTHINVOI D ON A.TAXNO<>'' AND A.TAXNO=D.TAXNO
    LEFT JOIN L_JOBORDER E ON A.JOBNO=E.JOBNO
    LEFT JOIN L_SVMAST R ON E.STRNO = R.STRNO
    WHERE A.STATUS<>'C' AND A.JOBTYP LIKE ? AND A.LOCAT LIKE ? AND A.SERVCOD LIKE ? AND A.CAMPNO LIKE ? AND A.CUSCOD LIKE ?
    AND ISDATE(A.TAXDATE)=1 AND CONVERT(datetime,A.TAXDATE) BETWEEN ? AND ?
    GROUP BY A.JOBNO,A.TAXNO,A.TAXDATE,A.JOBDATE,A.JOBTYP,
    CASE WHEN (A.TAXNO='' OR A.TAXNO IS NULL) THEN A.CUSCOD ELSE C.CUSCOD END,
    A.MDLCOD,A.STRNO,A.RLKILOMT,A.CAMPNO,A.STATUS,C.Paytyp,R.REGNO,A.CLAIM,D.VATTYPE,D.VAT,E.VATTYPE,E.VAT,D.CLAIMTYP

    UNION ALL

    /* 2. CN */
    SELECT
        A.JOBNO,A.TAXNO,A.TAXDATE,A.JOBDATE,A.JOBTYP,C.CUSCOD,A.MDLCOD,E.STRNO,E.RLKILOMT,E.CAMPNO,E.STATUS,A.CLAIM,
        SUM(-A.NETPRIC),0,0,0,0,SUM(-A.NETPRIC),0,0,0,0,0,0,SUM(-A.NETPRIC),0,0,0,0,SUM(-A.NETPRIC),
        C.Paytyp,R.REGNO,E.VATTYPE,E.VAT,'2',''
    FROM L_CN_SERV A JOIN L_TAXSAL C ON A.TAXNO=C.TAXNO
    LEFT JOIN L_JOBORDER E ON A.JOBNO=E.JOBNO
    LEFT JOIN L_SVMAST R ON E.STRNO = R.STRNO
    WHERE C.CANDAT IS NULL AND A.JOBTYP LIKE ? AND A.LOCAT LIKE ? AND A.SERVCOD LIKE ? AND E.CAMPNO LIKE ? AND C.CUSCOD LIKE ?
    AND ISDATE(A.TAXDATE)=1 AND CONVERT(datetime,A.TAXDATE) BETWEEN ? AND ? AND A.TAXNO<>''
    GROUP BY A.JOBNO,A.TAXNO,A.TAXDATE,A.JOBDATE,A.JOBTYP,C.CUSCOD,A.MDLCOD,E.STRNO,E.RLKILOMT,E.CAMPNO,E.STATUS,C.Paytyp,R.REGNO,A.CLAIM,E.VATTYPE,E.VAT

    UNION ALL

    /* 3. RETURN */
    SELECT
        C.JOBNO,C.CREDNO,C.CREDDT,E.RECVDATE,E.REPTYPE,E.CUSCOD,E.MDLCOD,E.STRNO,E.RLKILOMT,E.CAMPNO,E.STATUS,'',
        0,-SUM(A.NETPRC),0,0,-SUM(A.NETPRC),-SUM(A.NETPRC),0,-SUM(A.COST*A.QTYRTN),0,0,-SUM(A.COST*A.QTYRTN),-SUM(A.COST*A.QTYRTN),
        0,-SUM(A.NETPRC-(A.COST*A.QTYRTN)),0,0,-SUM(A.NETPRC-(A.COST*A.QTYRTN)),-SUM(A.NETPRC-(A.COST*A.QTYRTN)),
        B.PTYPE,R.REGNO,E.VATTYPE,E.VAT,'2',''
    FROM L_RT_TRAN A JOIN L_RT_INVOI C ON A.RTNNO=C.RTNNO
    LEFT JOIN L_AR_SERV B ON C.JOBNO=B.JOBNO AND C.TAXREFNO=B.DEVNO
    LEFT JOIN L_JOBORDER E ON C.JOBNO=E.JOBNO
    LEFT JOIN L_SVMAST R ON E.STRNO = R.STRNO
    WHERE C.FLAG='7' AND C.JOBNO<>'' AND C.CANDAT IS NULL
    AND E.REPTYPE LIKE ? AND C.RTNLOC LIKE ? AND E.REPCOD LIKE ? AND E.CAMPNO LIKE ? AND E.CUSCOD LIKE ?
    AND ISDATE(C.CREDDT)=1 AND CONVERT(datetime,C.CREDDT) BETWEEN ? AND ? AND C.CREDNO<>''
    GROUP BY C.JOBNO,C.CREDNO,C.CREDDT,E.RECVDATE,E.REPTYPE,E.CUSCOD,E.MDLCOD,E.STRNO,E.RLKILOMT,E.CAMPNO,E.STATUS,B.PTYPE,R.REGNO,E.VATTYPE,E.VAT
) XX
LEFT JOIN CUSTMAST B ON XX.CUSCOD=B.CUSCOD
WHERE XX.JOBNO<>''
ORDER BY XX.JOBNO, XX.FLAG
"""

# คอลัมน์ที่ map เป็นภาษาไทย สำหรับหน้า check-status
CLAIM_COLUMN_DISPLAY = {
    "JOBNO": "รหัสงาน",
    "TAXNO": "เลขที่ใบกำกับ",
    "TAXDATE": "วันที่",
    "CUSNAM": "ชื่อลูกค้า",
    "MDLCOD": "รุ่น",
    "STRNO": "เลขตัวถัง",
    "SERVNET": "ค่าแรง",
    "SERVCOS": "ต้นทุนค่าแรง",
    "SERVPRF": "กำไรค่าแรง",
    "PARTNET": "ค่าอะไหล่",
    "PARTCOS": "ต้นทุนอะไหล่",
    "PARTPRF": "กำไรอะไหล่",
    "OILNET": "ค่าน้ำมัน",
    "OILCOS": "ต้นทุนน้ำมัน",
    "OILPRF": "กำไรน้ำมัน",
    "OUTNET": "งานนอก",
    "OUTCOS": "ต้นทุนงานนอก",
    "OUTPRF": "กำไรงานนอก",
    "COLRNET": "งานสี",
    "COLRCOS": "ต้นทุนงานสี",
    "COLRPRF": "กำไรงานสี",
    "TOTALNET": "ยอดรวม",
    "TOTALCOS": "ต้นทุนรวม",
    "TOTALPRF": "กำไรรวม",
    "มูลค่าก่อนVAT": "มูลค่าก่อนVAT",
    "ภาษี": "ภาษี",
    "ยอดรวมภาษี": "ยอดรวมภาษี",
}


@app.get("/api/check-status/claim-report")
async def get_claim_report(
    startDate: str | None = Query(default=None, description="วันที่เริ่มต้น (YYYY-MM-DD)"),
    endDate: str | None = Query(default=None, description="วันที่สิ้นสุด (YYYY-MM-DD)"),
):
    """ดึงข้อมูล Claim Report จาก OMODA (JOB + CN + RETURN) — ไม่ส่งวันที่ = โหลดทั้งหมด"""
    from datetime import date
    today = date.today().isoformat()[:10]
    s = (startDate or "").strip()[:10]
    e = (endDate or "").strip()[:10]
    if s and e:
        start, end = s, e
        if start > end:
            start, end = end, start
    else:
        # ไม่ส่งวันที่ = ใช้ช่วงกว้าง (ได้หลายร้อยแถว) — ถ้าต้องการจำนวนเท่าที่เห็นใน DB ให้ส่ง startDate/endDate จากหน้าเว็บ
        start, end = "2025-09-01", "2026-12-31"
    params = (
        "%", "%", "%", "%", "%", start, end,
        "%", "%", "%", "%", "%", start, end,
        "%", "%", "%", "%", "%", start, end,
    )
    try:
        conn = get_omoda_connection()
        cur = conn.cursor()
        cur.execute(CLAIM_REPORT_SQL, params)
        rows = cur.fetchall()
        columns = [d[0] for d in cur.description]
        conn.close()
        data = []
        for row in rows:
            rec = {}
            for i, col in enumerate(columns):
                val = row[i]
                if val is None:
                    rec[col] = None
                elif hasattr(val, "isoformat"):
                    rec[col] = val.isoformat()
                else:
                    rec[col] = val
            data.append(rec)
        display_columns = []
        for c in columns:
            display_columns.append({"name": c, "display": CLAIM_COLUMN_DISPLAY.get(c, c)})
        return {"ok": True, "columns": display_columns, "data": data, "total_rows": len(data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# SQL ดึงพนักงานจาก OMODA (ตาราง OFFICER)
OFFICER_SQL = """
SELECT CODE, NAME, DEPCODE, LOCAT, OFFTYPE, STARID
FROM OFFICER
ORDER BY NAME, LOCAT, OFFTYPE
"""


@app.get("/api/check-status/officer")
async def get_officer_list():
    """ดึงข้อมูลพนักงานจาก OMODA (ตาราง OFFICER) — NAME, LOCAT, OFFTYPE"""
    try:
        conn = get_omoda_connection()
        cur = conn.cursor()
        cur.execute(OFFICER_SQL)
        rows = cur.fetchall()
        columns = [d[0] for d in cur.description]
        conn.close()
        data = []
        for row in rows:
            rec = {}
            for i, col in enumerate(columns):
                val = row[i]
                if val is None:
                    rec[col] = None
                elif hasattr(val, "isoformat"):
                    rec[col] = val.isoformat()
                else:
                    rec[col] = val
            data.append(rec)
        return {"ok": True, "data": data, "total_rows": len(data)}
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

        # เรียงคอลัมน์ให้ ค่าแรง, ค่าอะไหล่, ค่าน้ำมัน ฯลฯ แสดงก่อน (สำหรับ RegisterReport_2569)
        if schema_name == "dbo" and table_name == "RegisterReport_2569":
            cost_cols_order = ["ค่าแรง", "ค่าอะไหล่", "ค่าน้ำมัน", "งานนอก", "งานสี", "ยอดรวม", "มูลค่าก่อน", "กำไรรวม"]
            col_names = [c["name"] for c in columns]
            cost_in_table = [x for x in cost_cols_order if x in col_names]
            if cost_in_table:
                other_cols = [c for c in columns if c["name"] not in cost_in_table]
                cost_col_objs = [c for c in columns if c["name"] in cost_in_table]
                cost_col_objs_sorted = sorted(cost_col_objs, key=lambda x: cost_cols_order.index(x["name"]))
                columns = cost_col_objs_sorted + other_cols

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
                startRegDate, endRegDate, statusFilter
            )

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

    where_clauses, params = _register_report_where_clauses(startRegDate, endRegDate)
    if not where_clauses:
        raise HTTPException(status_code=400, detail="ต้องระบุเงื่อนไขกรองอย่างน้อยหนึ่งอย่าง (ช่วงวันที่)")

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


# เสิร์ฟ Frontend (React) เมื่อ build แล้ว มีโฟลเดอร์ frontend/dist
if FRONTEND_DIST.is_dir():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
