import { useState, useRef, useEffect } from 'react'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'

interface CropModalProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string
    initialCrop?: Crop // Added prop for restoring state
    onSave: (newImageSrc: string, cropData: Crop) => void // Updated signature
}

export default function CropModal({ isOpen, onClose, imageSrc, onSave, initialCrop }: CropModalProps) {
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const imgRef = useRef<HTMLImageElement>(null)

    // Reset crop when image changes or modal opens
    useEffect(() => {
        if (!isOpen) {
            setCrop(undefined)
            setCompletedCrop(undefined)
        }
    }, [isOpen])

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget

        // Use stored crop if available, otherwise default to full image
        const crop = initialCrop ? makeAspectCrop(initialCrop as any, width / height, width, height) : centerCrop(
            makeAspectCrop(
                {
                    unit: '%',
                    width: 100,
                },
                width / height,
                width,
                height
            ),
            width,
            height
        )

        setCrop(crop)
        // IMPORTANT: Initialize completedCrop too so if user saves immediately, it works.
        setCompletedCrop(convertToPixelCrop(crop, width, height))
    }

    const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
        const canvas = document.createElement('canvas')
        const scaleX = image.naturalWidth / image.width
        const scaleY = image.naturalHeight / image.height

        canvas.width = crop.width * scaleX
        canvas.height = crop.height * scaleY

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            throw new Error('No 2d context')
        }

        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            crop.width * scaleX,
            crop.height * scaleY,
        )

        return canvas.toDataURL('image/png')
    }

    const handleSave = async () => {
        if (completedCrop && imgRef.current) {
            try {
                const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop)
                onSave(croppedImageUrl, crop!) // Pass the current crop state (percent) back
            } catch (e) {
                console.error('Error cropping image:', e)
            }
        } else {
            // If no crop selection, just save original/current src
            // If no crop selection, just save original/current src but with full crop data if we can infer it?
            // Ideally we default "crop" to the full image crop we set on load.
            if (crop) {
                onSave(imageSrc, crop)
            } else {
                onSave(imageSrc, { unit: '%', width: 100, height: 100, x: 0, y: 0 })
            }
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
            {/* Click outside to cancel */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative z-10 flex flex-col items-center justify-center max-w-[90vw] max-h-[90vh]">
                <div className="bg-transparent relative shadow-2xl">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        className=""
                        // Style overrides for Canva-like look (optional custom CSS could go here or global)
                        style={{}}
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imageSrc}
                            onLoad={onImageLoad}
                            style={{
                                maxHeight: '80vh',
                                maxWidth: '80vw',
                                objectFit: 'contain',
                                display: 'block'
                            }}
                        />
                    </ReactCrop>
                </div>

                {/* Floating Controls Bar */}
                <div className="mt-6 flex items-center bg-white rounded-full shadow-lg px-4 py-2 space-x-2 animate-in slide-in-from-bottom-4 duration-300">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-gray-100 h-10 w-10 text-gray-500 hover:text-red-500 transition-colors"
                        title="Cancelar"
                    >
                        <X size={20} />
                    </Button>
                    <div className="w-px h-6 bg-gray-200 mx-2" />
                    <Button
                        onClick={handleSave}
                        className="rounded-full bg-[#7D4CDB] hover:bg-[#6b3bb5] text-white px-6 h-10 transition-colors font-medium"
                    >
                        <Check size={18} className="mr-2" />
                        Pronto
                    </Button>
                </div>
            </div>
        </div>
    )
}
