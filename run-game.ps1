# סקריפט להרצת המשחק
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  מתחיל להריץ את המשחק..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# בדיקה אם node_modules קיים
if (-not (Test-Path "node_modules")) {
    Write-Host "[1/2] מתקין תלויות - זה עלול לקחת כמה דקות..." -ForegroundColor Yellow
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "שגיאה בהתקנת התלויות!" -ForegroundColor Red
        Read-Host "לחץ Enter כדי לסגור"
        exit 1
    }
    Write-Host ""
    Write-Host "התקנה הושלמה בהצלחה!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[1/2] תלויות כבר מותקנות" -ForegroundColor Green
    Write-Host ""
}

# הפעלת שרת הפיתוח
Write-Host "[2/2] מפעיל שרת פיתוח..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  השרת מתחיל..." -ForegroundColor Green
Write-Host "  המשחק יפתח בדפדפן אוטומטית" -ForegroundColor Green
Write-Host "  כתובת: http://localhost:5173" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "לחץ Ctrl+C כדי לעצור את השרת" -ForegroundColor Gray
Write-Host ""

# הפעלת שרת הפיתוח (יפתח את הדפדפן אוטומטית)
npm run dev
