import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Button from './ui/Button';
import { useTranslation } from 'react-i18next';

interface ImageCropEditorProps {
  image: string;
  onComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropEditor({ image, onComplete, onCancel }: ImageCropEditorProps) {
  const { t } = useTranslation();
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Initialize crop when image loads
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.9;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCompletedCrop({
      x,
      y,
      width: size,
      height: size,
      unit: 'px'
    });
  };

  const getCroppedImg = async (): Promise<Blob> => {
    if (!imgRef.current) {
      throw new Error('No image reference');
    }

    const image = imgRef.current;
    
    // If no crop was made, use the whole image
    let cropToUse = completedCrop;
    if (!cropToUse) {
      const size = Math.min(image.width, image.height);
      const x = (image.width - size) / 2;
      const y = (image.height - size) / 2;
      cropToUse = { x, y, width: size, height: size, unit: 'px' };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Make canvas square for circular crop
    const targetSize = 400; // Fixed size for output
    canvas.width = targetSize;
    canvas.height = targetSize;

    ctx.drawImage(
      image,
      cropToUse.x * scaleX,
      cropToUse.y * scaleY,
      cropToUse.width * scaleX,
      cropToUse.height * scaleY,
      0,
      0,
      targetSize,
      targetSize
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  };

  const handleComplete = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      onComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto">
        <h3 className="text-xl font-semibold mb-4">Recortar Imagen</h3>
        
        <div className="mb-4 flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={image}
              alt="Crop"
              onLoad={onImageLoad}
              style={{ maxWidth: '100%', maxHeight: '60vh' }}
            />
          </ReactCrop>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleComplete}>
            {t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
