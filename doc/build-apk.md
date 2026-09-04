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
| Android do dispositivo | **7.0+ (API 24)** — ver seção abaixo |

## 🚫 Versão mínima do Android — 7.0 (API 24) — decisão: NÃO suportar Android 6

O APK **exige Android 7.0 ou superior**. Não é uma escolha do projeto — é o piso
oficial do React Native em uso:

- `react-native` **0.86.2** define `minSdk = "24"` em
  `node_modules/react-native/gradle/libs.versions.toml`;
- o plugin do Expo aplica esse valor no app
  (`ExpoRootProjectPlugin.kt` → `versionCatalogs.getVersionOrDefault("minSdk", "24")`);
- Android 6 (Marshmallow) = **API 23** < 24 → o próprio sistema bloqueia a
  instalação com `INSTALL_FAILED_OLDER_SDK`.

**Decisão (2026-09-04): abortar qualquer esforço de suportar Android 6** — não
compensa o investimento em tempo/testes. Não baixar o `minSdk`:

1. O RN não suporta API < 24 desde a versão 0.75 — New Architecture, Hermes e
   as libs do app (`react-native-screens`, `maplibre`, `expo-camera`,
   `expo-secure-store`) usam APIs do Android 7+ → APK que compila e **crasha
   em runtime**.
2. A pasta `android/` é apagada a cada `prebuild` — o ajuste teria que ser
   refeito e mantido num fork não suportado, para sempre.
3. Android 6 está sem patches de segurança desde 2017 — ruim para um app que
   trafega assinatura e fotos de clientes.

> **Obs. adicional sobre ABI:** celular da era Android 6 (e muitos Android 7/8
> baratos) é 32-bit (`armeabi-v7a`). O APK de celular atual é **arm64-v8a
> apenas** (`UMARIZAL_TARGET=celular`) — nesses aparelhos falha com
> `INSTALL_FAILED_NO_MATCHING_ABIS`. Se um dia precisar de 32-bit, remover o
> filtro ou incluir `armeabi-v7a` no plugin (`withAndroidReleaseAbiFilters.js`).

**Alternativas para aparelho com Android 6:** usar o site mobile
(`https://lavanderiaumarizal.com.br`) no navegador (Chrome do Android 6 parou
na v95, sem atualizações — pode degradar), ou trocar por qualquer aparelho com
Android 7.0+.

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

- **2026-09-04** — Decisão documentada: **versão mínima do Android = 7.0
  (API 24)**; suporte a Android 6 **abortado** (piso oficial do RN 0.86/Expo 57,
  sem custo-benefício). Ver seção "Versão mínima do Android".
- **2026-09-03** — APK `umarizal-1.0.0-arm64-20260903.apk` (49 MB, arm64-v8a,
  assinado com debug keystore local) com as correções da 1ª leva: rota do dia,
  almoxarifado, previsão detalhada, complemento de endereço e WhatsApp de entrega.
- **2026-08-18** — build anterior via `eas build --local` (141 MB, 4 ABIs,
  keystore EAS). Log completo em `doc/apk.md`.
