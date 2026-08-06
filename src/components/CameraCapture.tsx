/**
 * components/CameraCapture.tsx — Câmera para fotos da coleta (F18)
 *
 * Captura uma foto e retorna o base64 via onCapture.
 */

import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { colors } from '../theme';

interface Props {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  async function tirarFoto() {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const foto: CameraCapturedPicture | undefined = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.5,
      });
      if (foto?.base64) {
        onCapture(`data:image/jpeg;base64,${foto.base64}`);
      }
    } finally {
      setCapturing(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Precisamos da permissão da câmera para fotografar o tapete.</Text>
        <TouchableOpacity style={styles.botao} onPress={requestPermission}>
          <Text style={styles.botaoText}>Permitir câmera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.botao, styles.botaoSecundario]} onPress={onClose}>
          <Text style={styles.botaoSecundarioText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.controls}>
        <TouchableOpacity style={styles.cancelar} onPress={onClose}>
          <Text style={styles.cancelarText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.capturar} onPress={() => void tirarFoto()} disabled={capturing}>
          {capturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.capturarCircle} />
          )}
        </TouchableOpacity>
        <View style={styles.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 20,
    backgroundColor: '#000',
  },
  capturar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
  },
  cancelar: { padding: 10 },
  cancelarText: { color: '#fff', fontSize: 15 },
  placeholder: { width: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  msg: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  botao: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24, marginTop: 8 },
  botaoText: { color: '#fff', fontWeight: 'bold' },
  botaoSecundario: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  botaoSecundarioText: { color: colors.textSecondary, fontWeight: 'bold' },
});
