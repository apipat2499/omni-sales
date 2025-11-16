import React, { useState, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { CameraView, CameraType, Camera } from 'expo-camera';
import { Text, IconButton } from 'react-native-paper';
import { Button } from '../components';
import * as ImagePicker from 'expo-image-picker';

interface CameraScreenProps {
  navigation: any;
  route?: {
    params?: {
      onCapture?: (uri: string) => void;
    };
  };
}

export const CameraScreen: React.FC<CameraScreenProps> = ({ navigation, route }) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setHasPermission(cameraStatus === 'granted');
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      if (photo) {
        setPhoto(photo.uri);
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const handleRetake = () => {
    setPhoto(null);
  };

  const handleUsePhoto = () => {
    if (photo) {
      if (route?.params?.onCapture) {
        route.params.onCapture(photo);
      }
      navigation.goBack();
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <Button onPress={requestPermissions}>Grant Permission</Button>
      </View>
    );
  }

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} resizeMode="contain" />
        <View style={styles.previewActions}>
          <Button mode="outlined" onPress={handleRetake} style={styles.actionButton}>
            Retake
          </Button>
          <Button mode="contained" onPress={handleUsePhoto} style={styles.actionButton}>
            Use Photo
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.controls}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <IconButton icon="close" iconColor="#fff" size={30} />
          </TouchableOpacity>

          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.libraryButton} onPress={pickImage}>
              <IconButton icon="image" iconColor="#fff" size={30} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <IconButton icon="camera-flip" iconColor="#fff" size={30} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flex: 1,
    justifyContent: 'space-between',
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 40,
    marginLeft: 10,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  libraryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  flipButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#000',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  message: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
});
