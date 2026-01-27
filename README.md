<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/191UcBdIzK8crbkjfFFeQCHKbx_WX0dWl

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## הוספת תמונות למיכשולים

כדי להוסיף תמונות למיכשולים, שמור את התמונות בתיקיית `public` עם השמות הבאים:

- `obstacle-bush.png` - שיח
- `obstacle-ramp-kicker.png` - רמפה 1
- `obstacle-ramp-quarter.png` - רמפה 2
- `obstacle-fire-hydrant.png` - עמוד כיבוי אש
- `obstacle-bench.png` - ספסל
- `obstacle-bench-1.png` - ספסל 1
- `obstacle-bench-2.png` - ספסל 2
- `obstacle-trash-can.png` - פח אשפה

אם התמונה לא קיימת, המשחק ישתמש ברינדור תוכנתי (programmatic drawing) במקום.

**הערה:** הכלב והחתול נשארים כפי שהם ולא משתמשים בתמונות.

## הוספת מוזיקת רקע

כדי להוסיף מוזיקת רקע, שמור את קבצי המוזיקה בתיקיית `public` עם השמות הבאים:

- `menu-music.mp3` - מוזיקת רקע בתפריט הראשי
- `game-music.mp3` - מוזיקת רקע במהלך המשחק

**פורמטים נתמכים:** MP3, WAV, OGG

**הערה:** 
- אם הקבצים לא קיימים, המשחק ישתמש במוזיקה שנוצרת אוטומטית (Tone.js)
- הקבצים צריכים להיות בתיקיית `public` כדי שיהיו נגישים
- הקבצים יושמעו בלולאה (loop) אוטומטית