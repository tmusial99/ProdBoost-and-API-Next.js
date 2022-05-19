export default function generateCroppedImage(
    image:HTMLImageElement,
    crop:{
        x:number,
        y:number,
        width:number,
        height:number
    },
    quality: number
  ) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext('2d')
  
    if (!ctx) {
      throw new Error('No 2d context')
    }
  
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times and needing to
    // size the image back down if you want to download/upload and be
    // true to the images natural size.
    const pixelRatio = window.devicePixelRatio
    // const pixelRatio = 1
  
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio)
  
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'
  
    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY
  
    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2
  
    ctx.save()
  
    ctx.translate(-cropX, -cropY)
    ctx.translate(centerX, centerY)
    ctx.translate(-centerX, -centerY)
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
    )
  
    ctx.restore()
  
    // As Base64 string
    return canvas.toDataURL('image/jpeg', quality);
  }
  