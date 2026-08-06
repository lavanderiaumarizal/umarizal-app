/**
 * components/SignaturePad.tsx — Assinatura digital (F17)
 *
 * Usa react-native-signature-canvas (WebView com canvas).
 * onOK retorna a assinatura em base64 (data:image/png;base64,...).
 */

import Signature from 'react-native-signature-canvas';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  onOK: (base64: string) => void;
  onEmpty?: () => void;
}

export default function SignaturePad({ onOK, onEmpty }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>✍️ Assinatura digital</Text>
      <View style={styles.pad}>
        <Signature
          onOK={onOK}
          onEmpty={onEmpty}
          clearText="Limpar"
          confirmText="Confirmar"
          webStyle={`
            .m-signature-pad {
              background-color: ${colors.background};
              border: 1px solid ${colors.border};
            }
            .m-signature-pad--body {
              border: none;
            }
            .m-signature-pad--footer {
              background-color: ${colors.surface};
              border-top: 1px solid ${colors.border};
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
            }
            .m-signature-pad--footer .button {
              background-color: ${colors.primary};
              color: #fff;
              border-radius: 8px;
              padding: 10px 20px;
              font-size: 14px;
              font-weight: bold;
            }
            .m-signature-pad--footer .button.clear {
              background-color: ${colors.surfaceAlt};
              color: ${colors.textSecondary};
              border: 1px solid ${colors.border};
            }
            canvas {
              background-color: ${colors.background};
            }
          `}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  titulo: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pad: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
