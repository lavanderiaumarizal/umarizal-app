// Configuração dinâmica: UMARIZAL_TARGET=celular → APK só arm64 (leve)
const appJson = require('./app.json');

module.exports = () => {
  const isCelular = process.env.UMARIZAL_TARGET === 'celular';
  return {
    ...appJson.expo,
    android: {
      ...appJson.expo.android,
      ...(isCelular ? { abiFilters: ['arm64-v8a'] } : {}),
    },
  };
};
