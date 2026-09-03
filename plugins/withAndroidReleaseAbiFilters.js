const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

// APK leve: filtra apenas arm64-v8a quando UMARIZAL_TARGET=celular.
// São necessários DOIS mecanismos:
//  1. reactNativeArchitectures no gradle.properties — controla as libs do
//     core RN (libreactnative, libhermes*, libfbjni), extraídas pelo plugin
//     com.facebook.react fora do filtro de packaging.
//  2. ndk.abiFilters no defaultConfig — filtra as libs de dependências
//     (maplibre, webview etc.). O AGP ignora ndk.abiFilters dentro de
//     buildTypes, por isso vai no defaultConfig.
// Sem a variável, mantém todas as ABIs (emuladores x86_64 em builds debug).
module.exports = function withAndroidAbiFilters(config) {
  if (process.env.UMARIZAL_TARGET !== 'celular') {
    return config;
  }

  config = withGradleProperties(config, (cfg) => {
    const key = 'reactNativeArchitectures';
    cfg.modResults = cfg.modResults.filter(
      (p) => !(p.type === 'property' && p.key === key)
    );
    cfg.modResults.push({ type: 'property', key, value: 'arm64-v8a' });
    return cfg;
  });

  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;
    if (!contents.includes('abiFilters')) {
      contents = contents.replace(
        /defaultConfig\s*\{/,
        'defaultConfig {\n        ndk {\n            abiFilters = ["arm64-v8a"]\n        }'
      );
      cfg.modResults.contents = contents;
    }
    return cfg;
  });
};
