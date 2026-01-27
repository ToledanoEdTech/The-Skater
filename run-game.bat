@echo off
chcp 65001 >nul
echo ========================================
echo   מתחיל להריץ את המשחק...
echo ========================================
echo.

REM בדיקה אם node_modules קיים
if not exist "node_modules" (
    echo [1/2] מתקין תלויות - זה עלול לקחת כמה דקות...
    echo.
    call npm install
    if errorlevel 1 (
        echo שגיאה בהתקנת התלויות!
        pause
        exit /b 1
    )
    echo.
    echo התקנה הושלמה בהצלחה!
    echo.
) else (
    echo [1/2] תלויות כבר מותקנות
    echo.
)

REM הפעלת שרת הפיתוח
echo [2/2] מפעיל שרת פיתוח...
echo.
echo ========================================
echo   השרת מתחיל...
echo   המשחק יפתח בדפדפן אוטומטית
echo   כתובת: http://localhost:5173
echo ========================================
echo.
echo לחץ Ctrl+C כדי לעצור את השרת
echo.

REM הפעלת שרת הפיתוח (יפתח את הדפדפן אוטומטית)
call npm run dev

pause
