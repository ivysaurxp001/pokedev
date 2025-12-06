import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Image as ImageIcon, X, Upload, Clipboard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ImageUploaderProps {
    projectId: string;
    images: string[];
    onChange: (images: string[]) => void;
    disabled?: boolean;
}

const STORAGE_BUCKET = 'project-images';

const ImageUploader: React.FC<ImageUploaderProps> = ({ projectId, images, onChange, disabled = false }) => {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Use ref to always have current images value (avoid stale closure)
    const imagesRef = useRef(images);
    imagesRef.current = images;

    // Handle paste event for clipboard images
    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        if (disabled) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await uploadImage(file);
                }
                break;
            }
        }
    }, [disabled, projectId]);

    // Add/remove paste event listener
    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            document.addEventListener('paste', handlePaste);
            return () => {
                document.removeEventListener('paste', handlePaste);
            };
        }
    }, [handlePaste]);

    // Compress image before upload (resize + convert to WebP)
    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Max dimensions: 1200x800 for thumbnails
                const MAX_WIDTH = 1200;
                const MAX_HEIGHT = 800;

                let { width, height } = img;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > MAX_WIDTH) {
                    height = (height * MAX_WIDTH) / width;
                    width = MAX_WIDTH;
                }
                if (height > MAX_HEIGHT) {
                    width = (width * MAX_HEIGHT) / height;
                    height = MAX_HEIGHT;
                }

                canvas.width = width;
                canvas.height = height;

                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to WebP with 80% quality (good balance)
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/webp',
                    0.8
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    const uploadImage = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed');
            return;
        }

        // Max 10MB before compression
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be less than 10MB');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Compress image first
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp'
            });

            console.log(`Compressed: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`);

            const fileName = `${projectId}/${crypto.randomUUID()}.webp`;

            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                // If bucket doesn't exist, provide helpful error
                if (uploadError.message.includes('not found')) {
                    throw new Error('Storage bucket not configured. Make sure "project-images" bucket exists in Supabase.');
                }
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);

            onChange([...imagesRef.current, publicUrl]);
        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of files) {
            await uploadImage(file);
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await uploadImage(file);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    return (
        <div ref={containerRef} className="space-y-3">
            <label className="block text-xs font-mono-tech text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ImageIcon size={14} className="text-pink-500" /> Project Screenshots
            </label>

            {/* Drop Zone */}
            <div
                onClick={() => !disabled && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          border-2 border-dashed p-4 transition-all cursor-pointer relative overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${dragOver ? 'border-pink-500 bg-pink-500/5' : 'border-slate-700 hover:border-pink-500/50 hover:bg-slate-900/50'}
          ${error ? 'border-red-500/50 bg-red-950/10' : ''}
        `}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled || uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="animate-spin text-pink-400 mb-2" size={24} />
                        <span className="text-pink-300 font-mono-tech text-xs">UPLOADING...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                        <div className="flex items-center gap-3 mb-2">
                            <Upload size={18} className="text-slate-500" />
                            <Clipboard size={18} className="text-slate-500" />
                        </div>
                        <p className="text-xs font-mono-tech text-slate-500">
                            DROP IMAGE, CLICK TO UPLOAD, OR <span className="text-pink-400">PASTE FROM CLIPBOARD (Ctrl+V)</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-xs font-mono-tech text-red-400">{error}</p>
            )}

            {/* Image Gallery */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((img, i) => (
                        <div key={i} className="relative aspect-video bg-slate-800 border border-slate-700 overflow-hidden group">
                            <img
                                src={img}
                                alt={`Screenshot ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(i);
                                    }}
                                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
