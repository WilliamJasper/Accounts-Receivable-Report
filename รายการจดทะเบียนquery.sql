-- ============================================================
-- ดึงข้อมูลภาษีขาย (Inpdt, tmbill, ชื่อ, เลขตัวถัง) จากวันที่ 1 มกราคม 2025
-- พร้อมรายละเอียดรถ (เลขเครื่อง, รุ่น, สี) จาก INVTRAN ตามเลขตัวถัง
-- รวมจาก: ดึงภาษีขาย-เฉพาะคอลัมน์ + ดึงภาษีขาย-สาขา01 + รายละเอียดรถจาก INVTRAN
-- ============================================================

USE [GEELY];
GO

DECLARE @P1 varchar(3)   = '01%';           -- สาขา 01
DECLARE @P2 datetime     = '2025-01-01';   -- จากวันที่ 1 มกราคม 2025
DECLARE @P3 datetime     = GETDATE();      -- ถึงวันที่ = วันนี้
DECLARE @P4 varchar(1)   = '%';             -- ประเภทการขาย = ทั้งหมด

;WITH TaxData AS (
  SELECT
    t.locat, t.taxno, t.taxdt, t.Inpdt, t.tmbill,
    t.name1, t.name2, t.strno,
    t.contno, t.cuscod, t.tsale, t.taxflg, t.PAYFOR, '' AS Frsv
  FROM taxtran t
  UNION
  SELECT
    t.Locat, t.taxno, t.taxdate AS taxdt, t.Time1 AS Inpdt, '' AS tmbill,
    b.name1, b.name2, '' AS strno,
    (CASE WHEN t.Jobno <> '' THEN t.jobno ELSE (CASE WHEN t.taxrefno = t.taxno THEN t.cuscod ELSE t.taxrefno END) END) AS contno,
    t.cuscod, 'P' AS tsale, 'N' AS taxflg, '' AS PAYFOR, t.Frsv
  FROM L_taxsal t
  LEFT OUTER JOIN custmast b ON t.cuscod = b.cuscod
  WHERE SUBSTRING(t.TAXREFNO, 2, 2) <> 'FE'
),
Filtered AS (
  SELECT
    A.Inpdt,
    A.tmbill,
    ISNULL(A.name1, '') + ' ' + ISNULL(A.name2, '') AS name1_name2,
    RTRIM(LTRIM(A.strno)) AS strno
  FROM TaxData A
  WHERE (A.locat LIKE @P1)
    AND (A.taxdt BETWEEN @P2 AND @P3)
    AND (A.taxflg = 'N')
    AND (A.tsale LIKE @P4)
    AND (A.TSALE <> 'P')
    AND (A.FRSV <> 'N')
    AND SUBSTRING(A.taxno, 2, 2) <> 'FE'
)
SELECT
  F.Inpdt,
  F.tmbill,
  F.name1_name2,
  F.strno AS เลขตัวถัง,
  RTRIM(LTRIM(V.ENGNO)) AS เลขเครื่อง,
  RTRIM(LTRIM(V.MODEL))  AS รุ่น,
  RTRIM(LTRIM(V.COLOR))  AS สี
FROM Filtered F
LEFT JOIN INVTRAN V
  ON RTRIM(LTRIM(V.STRNO)) = F.strno
  AND F.strno <> ''
ORDER BY F.Inpdt, F.tmbill;

GO
