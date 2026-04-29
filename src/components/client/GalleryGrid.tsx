import Link from 'next/link';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage, PropertyImage } from '@/types/database';

type ImageItem = GalleryImage | PropertyImage;

export default function GalleryGrid({
  images,
  lightboxIndex,
  basePath = '/gallery',
}: {
  images: ImageItem[];
  lightboxIndex?: number;
  basePath?: string;
}) {
  if (!images.length) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p>No images to display.</p>
      </div>
    );
  }

  const isOpen =
    typeof lightboxIndex === 'number' &&
    lightboxIndex >= 0 &&
    lightboxIndex < images.length;
  const current = isOpen ? images[lightboxIndex] : null;
  const prevIdx = isOpen
    ? (lightboxIndex - 1 + images.length) % images.length
    : 0;
  const nextIdx = isOpen ? (lightboxIndex + 1) % images.length : 0;

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {images.map((image, index) => (
          <Link
            key={image.id}
            href={`${basePath}?img=${index}`}
            prefetch={false}
            scroll={false}
            className="block w-full break-inside-avoid group overflow-hidden rounded-xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt_text || 'Gallery image'}
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </Link>
        ))}
      </div>

      {isOpen && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
          <Link
            href={basePath}
            prefetch={false}
            scroll={false}
            className="absolute inset-0"
            aria-label="Close lightbox"
          />

          <Link
            href={basePath}
            prefetch={false}
            scroll={false}
            className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </Link>

          <Link
            href={`${basePath}?img=${prevIdx}`}
            prefetch={false}
            scroll={false}
            className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>

          <Link
            href={`${basePath}?img=${nextIdx}`}
            prefetch={false}
            scroll={false}
            className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Link>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.url}
            alt={current.alt_text || 'Gallery image'}
            className="relative max-h-[90vh] max-w-[90vw] object-contain rounded-lg animate-scale-in"
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm pointer-events-none">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
