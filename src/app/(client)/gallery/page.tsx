import { createClient } from '@/lib/supabase/server';
import GalleryGrid from '@/components/client/GalleryGrid';
import type { GalleryImage } from '@/types/database';

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ img?: string }>;
}) {
  const params = await searchParams;
  const imgParam = params.img ? parseInt(params.img, 10) : undefined;
  const lightboxIndex =
    typeof imgParam === 'number' && !isNaN(imgParam) ? imgParam : undefined;

  const supabase = await createClient();
  const { data } = await supabase
    .from('gallery_images')
    .select('*')
    .order('sort_order', { ascending: true });

  const images = (data ?? []) as GalleryImage[];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="hero-mediterranean py-24 lg:py-32 pt-32 lg:pt-40">
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center animate-fade-up">
          <span className="inline-flex items-center gap-3 font-mono text-[10.5px] tracking-[0.28em] uppercase text-emerald-700 mb-4">
            <span className="h-px w-6 bg-emerald-700/50" />
            Vizualni obilazak
            <span className="h-px w-6 bg-emerald-700/50" />
          </span>
          <h1 className="font-display font-medium text-ink text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            <span className="italic text-emerald-700">Galerija</span>
          </h1>
          <p className="mt-6 text-[15.5px] sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
            Pogledajte Casa Graziju izbliza — bazen, terasu, interijer i istarski krajolik koji je okružuje.
          </p>
        </div>
      </div>

      {/* Gallery */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <GalleryGrid images={images} lightboxIndex={lightboxIndex} />
        </div>
      </div>
    </div>
  );
}
