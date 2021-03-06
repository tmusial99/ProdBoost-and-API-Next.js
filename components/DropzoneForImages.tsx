import { Group, Text, useMantineTheme, MantineTheme, Modal, Button } from '@mantine/core';
import { Upload, Photo, X, Icon as TablerIcon, CameraPlus } from 'tabler-icons-react';
import { Dropzone, DropzoneStatus, MIME_TYPES } from '@mantine/dropzone';
import { useState } from 'react';
import Cropper from 'react-easy-crop';
import generateCroppedImage from '../lib/generateCroppedImage';
import axios from '../lib/axios';
import { AxiosError } from 'axios';
import { updateSession } from '../lib/sessionHelpers';

export default function DropzoneForImages({ apiRoute, componentId, callback}: { apiRoute: string, componentId?: string, callback?: (url: string) => void }) {
  const theme = useMantineTheme();
  const [imageSrc, setImageSrc] = useState<any>(null);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [sendingData, setSendingData] = useState(false);

  return (
    <>
      <Modal
        transition="fade"
        centered={true}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        onClose={() => {}}
        opened={imageSrc !== null}
        size="lg"
      >
        <CropImage imageSrc={imageSrc} setCroppedArea={setCroppedArea} sendingData={sendingData} />
        <Group mt={20} position="center">
          <Button
            disabled={sendingData}
            variant="outline"
            color="red"
            onClick={() => setImageSrc(null)}
          >
            Cofnij
          </Button>
          <Button
            loading={sendingData}
            color="green"
            leftIcon={<CameraPlus size={20} />}
            onClick={async () => {
              try {
                setSendingData(true);
                const base64cropped = generateCroppedImage(
                  await createImage(imageSrc.imageUrl),
                  croppedArea,
                  0.8
                ); 
                const jsonBody = componentId ? {base64: base64cropped, componentId: componentId} : {base64: base64cropped}
                const { data } = await axios.post(apiRoute, jsonBody);
                if(callback){
                  callback(data);
                  return;
                } 
                if (apiRoute === '/api/account/changePicture') {
                  await updateSession();
                }
                setCroppedArea(null);
                setImageSrc(null);
                setSendingData(false);
              } catch (e) {
                const error = e as AxiosError;
                console.dir(error);
                setSendingData(false);
              }
            }}
          >
            Ustaw zdj??cie
          </Button>
        </Group>
      </Modal>
      <Dropzone
        onDrop={async (files) => {
          const imageDataUrl = await readFile(files[0]);
          setImageSrc(imageDataUrl);
        }}
        onReject={(files) => {
          if (files[0].errors[0].code === 'file-invalid-type') {
            alert('Nieobs??ugiwany format pliku.');
            return;
          }
          if (files[0].errors[0].code === 'file-too-large') {
            alert('Plik ma za du??y rozmiar. Maksymalny rozmiar pliku to 5MB.');
            return;
          }
        }}
        maxSize={5_242_880}
        accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.webp]}
        multiple={false}
      >
        {(status) => dropzoneChildren(status, theme)}
      </Dropzone>
    </>
  );
}

function readFile(file: File) {
  return new Promise<{
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      async () => {
        const dimensions = await getImageDimensions(reader.result as string);
        resolve({
          imageUrl: reader.result as string,
          imageWidth: dimensions.imageWidth,
          imageHeight: dimensions.imageHeight,
        });
      },
      false
    );
    reader.readAsDataURL(file);
  });
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.src = url;
  });
}
function getImageDimensions(result: string) {
  return new Promise<{
    imageWidth: number;
    imageHeight: number;
  }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        imageWidth: img.width,
        imageHeight: img.height,
      });
    };
    img.src = result;
  });
}

function getIconColor(status: DropzoneStatus, theme: MantineTheme) {
  return status.accepted
    ? theme.colors[theme.primaryColor][theme.colorScheme === 'dark' ? 4 : 6]
    : status.rejected
    ? theme.colors.red[theme.colorScheme === 'dark' ? 4 : 6]
    : theme.colorScheme === 'dark'
    ? theme.colors.dark[0]
    : theme.colors.gray[7];
}

function ImageUploadIcon({
  status,
  ...props
}: React.ComponentProps<TablerIcon> & { status: DropzoneStatus }) {
  if (status.accepted) {
    return <Upload {...props} />;
  }

  if (status.rejected) {
    return <X {...props} />;
  }

  return <Photo {...props} />;
}

const dropzoneChildren = (status: DropzoneStatus, theme: MantineTheme) => (
  <Group position="center" spacing="xl" style={{ minHeight: 220, pointerEvents: 'none' }}>
    <ImageUploadIcon status={status} style={{ color: getIconColor(status, theme) }} size={80} />

    <div>
      <Text size="xl" inline>
        Przeci??gnij zdj??cie tutaj lub kliknij, aby wybra?? plik.
      </Text>
      <Text size="sm" color="dimmed" inline mt={7}>
        Plik nie powinien przekracza?? rozmiaru 5MB.
      </Text>
      <Text size="sm" color="dimmed" inline mt={7}>
        Obs??ugiwane formaty: .jpg, .jpeg, .png, .webp
      </Text>
    </div>
  </Group>
);

function CropImage({
  imageSrc,
  setCroppedArea,
  sendingData,
}: {
  imageSrc: any;
  setCroppedArea: any;
  sendingData: boolean;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '1/1',
        width: '100%'
      }}
    >
      <Cropper
        aspect={1 / 1}
        image={imageSrc?.imageUrl}
        crop={crop}
        zoom={zoom}
        zoomSpeed={0.3}
        onCropChange={sendingData ? () => {} : setCrop}
        onZoomChange={sendingData ? () => {} : setZoom}
        onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedArea(croppedAreaPixels)}
        objectFit={
          imageSrc?.imageWidth >= imageSrc?.imageHeight ? 'vertical-cover' : 'horizontal-cover'
        }
      />
    </div>
  );
}
