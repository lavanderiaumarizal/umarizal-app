# 📱 Build local do APK (umarizal.app)

Build 100% local via Gradle — não usa EAS cloud, não precisa de login Expo.

## ⚡ Resumo rápido (APK leve para celular, ~49 MB)

```bash
cd /home/lavanderia/GitHub/umarizal.app

# 1. Gerar o projeto nativo com filtro arm64 (se o android/ não existir)
UMARIZAL_TARGET=celular npx expo prebuild -p android --no-install

# 2. Compilar o APK release
cd android && ./gradlew assembleRelease

# Artefato:
# android/app/build/outputs/apk/release/app-release.apk
```

## 📋 Pré-requisitos

| Item | Valor esperado |
|------|----------------|
| Java | OpenJDK 21 (`java -version`) |
| ANDROID_HOME | `/home/lavanderia/Android/Sdk` |
| Node | instalado + `node_modules` atualizado (`npm install`) |

## 🔧 Como funciona o filtro de ABI (arm64-v8a)

O APK para celular inclui **somente arm64-v8a**, caindo de ~141 MB para ~49 MB.
Isso é controlado pela variável `UMARIZAL_TARGET=celular`, aplicada pelo plugin
`plugins/withAndroidReleaseAbiFilters.js` durante o `expo prebuild`:

1. `reactNativeArchitectures=arm64-v8a` no `android/gradle.properties` — filtra as
   libs do core RN (`libreactnative`, `libhermes*`, `libfbjni`), que o plugin
   `com.facebook.react` extrai fora do filtro de packaging.
2. `ndk { abiFilters = ["arm64-v8a"] }` no `defaultConfig` do
   `android/app/build.gradle` — filtra as libs de dependências (maplibre, webview).

> ⚠️ **Armadilhas conhecidas**
> - `ndk.abiFilters` dentro de `buildTypes.release` é **ignorado** pelo AGP —
>   precisa ficar no `defaultConfig`.
> - Depois de mudar ABI/configuração, o Gradle pode considerar `packageRelease`
>   UP-TO-DATE e **não regenerar o APK**. Nesse caso:
>   `rm -rf android/app/build/intermediates android/app/build/outputs`
> - Sem `UMARIZAL_TARGET=celular`, o build inclui todas as ABIs (necessário
>   para emuladores x86_64).

## 🔐 Assinatura

O release é assinado com o **debug keystore** padrão do template Expo
(`android/app/debug.keystore`, senhas `android`/`android`, alias `androiddebugkey`).

- Backup do keystore: `.android/debug.keystore` (fora do `android/`, que é
  apagado a cada prebuild — o `.android/` está no `.gitignore` e sobrevive).
- Se o keystore mudar, o Android exigirá **desinstalar o app antigo** antes de
  instalar o novo (assinaturas diferentes).
- O APK anterior distribuído (build de 2026-08-18) foi assinado por keystore
  gerenciado do EAS — **incompatível** com builds locais: desinstale antes.

## 📦 Instalação no celular

```bash
# Via adb (depuração USB):
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Ou copie o APK para o celular e abra-o (permitir "instalar apps desconhecidos").
```

## ✅ Validação do APK

```bash
SDK=/home/lavanderia/Android/Sdk/build-tools/36.0.0
$SDK/aapt2 dump badging android/app/build/outputs/apk/release/app-release.apk | grep native-code
# Esperado: native-code: 'arm64-v8a'
$SDK/apksigner verify --print-certs android/app/build/outputs/apk/release/app-release.apk
# Esperado: CN=Android Debug, SHA-256 fac61745...
```

## 🐞 Dicas de debugging

- Log em tempo real: `adb logcat | grep -i ReactNative`
- Ver o dispositivo: `adb devices`
- Build debug (para rodar com `npx expo start`): `cd android && ./gradlew assembleDebug`
  — lembre que com o filtro arm64 ativo, emuladores x86_64 só instalam o app via
  tradução binária (Android 11+); sem filtro, tudo funciona nativamente.

---

## 📜 Histórico

- **2026-09-03** — APK `umarizal-1.0.0-arm64-20260903.apk` (49 MB, arm64-v8a,
  assinado com debug keystore local) com as correções da 1ª leva: rota do dia,
  almoxarifado, previsão detalhada, complemento de endereço e WhatsApp de entrega.
- **2026-08-18** — build anterior via `eas build --local` (141 MB, 4 ABIs,
  keystore EAS). Log completo em `doc/apk.md`.
