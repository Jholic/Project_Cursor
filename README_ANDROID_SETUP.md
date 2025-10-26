# 📱 스마트폰에서 앱으로 사용하기 가이드

## 필요한 준비물

### 1. 개발 환경 설정
- **Android Studio** (최신 버전)
- **Java JDK 17** (Android Studio 설치 시 포함)
- **Node.js 18+** (이미 설치되어 있음)

### 2. 프로젝트 빌드하기

#### 2.1 의존성 설치
```bash
cd app
npm install
```

#### 2.2 웹 앱 빌드
```bash
npm run build
```
이 명령은 `dist` 폴더에 웹 앱을 빌드합니다.

#### 2.3 Capacitor Android 동기화
```bash
npx cap sync android
```
이 명령은 `dist` 폴더의 내용을 Android 프로젝트에 복사합니다.

### 3. Android Studio에서 빌드하기

#### 3.1 프로젝트 열기
1. Android Studio를 실행
2. `Open an Existing Project` 선택
3. `app/android` 폴더 열기

#### 3.2 디바이스 설정
**옵션 A: 실제 스마트폰 사용**
1. 스마트폰에서 개발자 모드 활성화
   - 설정 → 휴대전화 정보 → 빌드 번호를 7회 탭
2. USB 디버깅 활성화
   - 설정 → 개발자 옵션 → USB 디버깅
3. USB로 스마트폰을 컴퓨터에 연결
4. Android Studio에서 디바이스 선택

**옵션 B: 에뮬레이터 사용**
1. Android Studio에서 `AVD Manager` 열기
2. `Create Virtual Device` 클릭
3. 원하는 디바이스 선택 (예: Pixel 5)
4. 시스템 이미지 선택 (API 30 이상 권장)
5. 에뮬레이터 실행

#### 3.3 앱 빌드 및 실행
1. Android Studio 상단에서 디바이스 선택
2. ▶️ (Run) 버튼 클릭 또는 `Shift + F10`
3. 앱이 빌드되고 설치됩니다

### 4. APK 파일 생성하기 (배포용)

#### 4.1 Debug APK
Android Studio에서:
1. `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 빌드 완료 후 `locate` 클릭
3. 생성된 APK 파일을 스마트폰으로 전송

#### 4.2 Release APK (서명 필요)
1. `Build` → `Generate Signed Bundle / APK`
2. `APK` 선택
3. 새 키스토어 생성 또는 기존 키스토어 선택
4. 빌드 완료 후 APK 설치

### 5. 스마트폰에서 직접 설치하기

생성된 APK 파일을 스마트폰으로 전송한 후:
1. 파일 관리자에서 APK 파일 클릭
2. "알 수 없는 출처" 허용 (첫 설치 시)
3. 설치 진행

## 🔄 업데이트 방법

앱을 수정한 후:

```bash
cd app

# 1. 웹 앱 다시 빌드
npm run build

# 2. Android 프로젝트에 동기화
npx cap sync android

# 3. Android Studio에서 다시 빌드
```

Android Studio에서 자동으로 변경사항을 감지하므로, Run 버튼을 누르면 됩니다.

## ⚠️ 주의사항

1. **API 키**: Gemini API 키는 `Profile` 또는 `Chat` 페이지에서 설정해야 합니다.
2. **권한**: 앱은 알림 권한이 필요합니다 (Meditation 기능 사용 시).
3. **인터넷**: AI 기능 사용 시 인터넷 연결이 필요합니다.

## 📝 명령어 요약

```bash
# 처음 한 번만 실행
cd app
npm install

# 앱 수정 후 실행
npm run build
npx cap sync android

# 그 다음 Android Studio에서 Run 버튼 클릭
```

## 🆘 문제 해결

### "Android SDK not found" 오류
- Android Studio에서 SDK 경로 확인
- `app/android/local.properties` 파일 생성:
  ```properties
  sdk.dir=C:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
  ```

### 빌드 오류
- `cd app && npm install` 재실행
- `npx cap sync android` 재실행
- Android Studio에서 `Build` → `Clean Project`

### 개발자 모드가 활성화되지 않음
- 일부 제조사(Samsung, Xiaomi 등)는 추가 보안 설정이 필요할 수 있습니다
- USB 디버깅을 위해 추가 권한 설정이 필요할 수 있습니다

