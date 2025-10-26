# Android 앱 빌드 스크립트
Write-Host "🚀 Android 앱 빌드 시작..." -ForegroundColor Green

# 1. 웹 앱 빌드
Write-Host "`n📦 웹 앱 빌드 중..." -ForegroundColor Cyan
npm run build

# 2. Capacitor 동기화
Write-Host "`n🔄 Android 프로젝트 동기화 중..." -ForegroundColor Cyan
npx cap sync android

Write-Host "`n✅ 빌드 완료!" -ForegroundColor Green
Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. Android Studio를 엽니다"
Write-Host "2. app/android 폴더를 엽니다"
Write-Host "3. Run 버튼을 클릭합니다" -ForegroundColor White

