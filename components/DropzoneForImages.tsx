import { Group, Text, useMantineTheme, MantineTheme, Modal, Button } from '@mantine/core';
import { Upload, Photo, X, Icon as TablerIcon, CameraPlus } from 'tabler-icons-react';
import { Dropzone, DropzoneStatus, IMAGE_MIME_TYPE, MIME_TYPES } from '@mantine/dropzone';
import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import generateCroppedImage from '../lib/generateCroppedImage';
import axios from '../lib/axios';
import { AxiosError } from 'axios';
import { updateSession } from '../lib/sessionHelpers';

export default function DropzoneForImages({apiRoute}:{apiRoute:string}) {
  const theme = useMantineTheme();
  const [imageSrc, setImageSrc] = useState<any>(null);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [sendingData, setSendingData] = useState(false);

  return (
    <>
      <Modal
        transition='fade'
        centered={true}
        withCloseButton={false}
        closeOnClickOutside={false}
        closeOnEscape={false}
        onClose={()=>{}}
        opened={imageSrc !== null}
        size='lg'
      >
        <CropImage imageSrc={imageSrc} setCroppedArea={setCroppedArea}/>
        <Group mt={20} position='center'>
          <Button disabled={sendingData} variant='outline' color='red' onClick={() => setImageSrc(null)}>Cofnij</Button>
          <Button loading={sendingData} color='green' leftIcon={<CameraPlus size={20}/>} onClick={async () => {
            const base64cropped = generateCroppedImage(await createImage(imageSrc.imageUrl), croppedArea, 0.9);
            try{
              setSendingData(true)
              const {data} = await axios.post(apiRoute, {base64: base64cropped})
              if(apiRoute === '/api/account/changePicture'){
                await updateSession();
              }
              setCroppedArea(null);
              setImageSrc(null);
              setSendingData(false);
            }
            catch(e){
              const error = e as AxiosError
              console.dir(error)
              setSendingData(false);
            }
          }}>
            Ustaw zdjęcie
          </Button>
        </Group>
      </Modal>
      <Dropzone
        onDrop={async (files) => {
          const imageDataUrl = await readFile(files[0]);
          setImageSrc(imageDataUrl);
        }}
        onReject={(files) => {
          if(files[0].errors[0].code === 'file-invalid-type'){
            alert('Nieobsługiwany format pliku.')
            return;
          }
          if(files[0].errors[0].code === 'file-too-large'){
            alert('Plik ma za duży rozmiar. Maksymalny rozmiar pliku to 5MB.')
            return;
          }
        }}
        maxSize={5_242_880}
        accept={[MIME_TYPES.jpeg, MIME_TYPES.png, MIME_TYPES.webp]}
      >
        {(status) => dropzoneChildren(status, theme)}
      </Dropzone>
    </>
  );
}

function readFile(file:File){
  return new Promise<{
    imageUrl: string,
    imageWidth: number,
    imageHeight: number
  }>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', async () => {
      const dimensions = await getImageDimensions(reader.result as string)
      resolve({
        imageUrl: reader.result as string,
        imageWidth: dimensions.imageWidth,
        imageHeight: dimensions.imageHeight
      })
    }, false);
    reader.readAsDataURL(file);
  })
}

function createImage(url:string){
  return new Promise<HTMLImageElement>((resolve) => {
    const img = new Image;
    img.onload = () => {
      resolve(img)
    }
    img.src = url
  })
}
function getImageDimensions(result:string){
  return new Promise<{
    imageWidth: number,
    imageHeight: number
  }>((resolve) => {
    const img = new Image;
    img.onload = () => {
      resolve({
        imageWidth: img.width,
        imageHeight: img.height
      })
    }
    img.src = result;
  })
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
        Przeciągnij zdjęcie tutaj lub kliknij, aby wybrać plik.
      </Text>
      <Text size="sm" color="dimmed" inline mt={7}>
        Plik nie powinien przekraczać rozmiaru 5MB.
      </Text>
      <Text size="sm" color="dimmed" inline mt={7}>
        Obsługiwane formaty: .jpg, .jpeg, .png, .webp
      </Text>
    </div>
  </Group>
);

function CropImage({imageSrc, setCroppedArea}:{imageSrc:any, setCroppedArea:any}){
  const [crop, setCrop] = useState({x:0, y:0});
  const [zoom, setZoom] = useState(1);

  return(
    <div style={{
      position:'relative',
      aspectRatio:'1/1',
      width:'100%',
    }}>
      <Cropper
        aspect={1/1}
        image={imageSrc?.imageUrl}
        crop={crop}
        zoom={zoom}
        zoomSpeed={0.3}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedArea(croppedAreaPixels)}
        objectFit={imageSrc?.imageWidth >= imageSrc?.imageHeight ? 'vertical-cover' : 'horizontal-cover'}
      />
    </div>
  )
}