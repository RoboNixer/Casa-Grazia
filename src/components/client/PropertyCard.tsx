import Link from 'next/link';
import { BedDouble, Bath, Users, ArrowUpRight } from 'lucide-react';
import type { Property } from '@/types/database';
import { formatCurrency } from '@/lib/utils';

const typeLabels: Record<string, string> = {
  apartment: 'Apartman',
  villa: 'Vila',
  studio: 'Studio',
  house: 'Kuća',
  room: 'Soba',
};

export default function PropertyCard({ property }: { property: Property }) {
  const coverImage = property.images?.find((img) => img.is_cover) ?? property.images?.[0];

  return (
    <Link
      href={`/book?property=${property.id}`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-premium hover:shadow-premium-hover transition-all duration-500 border border-emerald-900/[0.07] hover:border-emerald-700/30 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={coverImage.url}
            alt={coverImage.alt_text || property.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            style={{ transformOrigin: 'center center' }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-slate-300 gap-2">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-xs">Nema slike</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Type badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-slate-700 tracking-wide shadow-sm">
            {typeLabels[property.property_type] ?? property.property_type}
          </span>
        </div>

        {/* Arrow on hover */}
        <div className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <ArrowUpRight className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display text-[20px] text-ink group-hover:text-emerald-700 transition-colors duration-200 tracking-tight leading-none">
          {property.name}
        </h3>
        {property.short_description && (
          <p className="mt-1.5 text-[13px] text-ink-muted line-clamp-2 leading-relaxed">
            {property.short_description}
          </p>
        )}

        {/* Amenity pills */}
        <div className="mt-3.5 flex items-center gap-3 text-[12.5px] text-ink-faint">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-ink-muted">{property.bedrooms}</span>
            <span>soba{property.bedrooms !== 1 ? '' : ''}</span>
          </span>
          <span className="w-px h-3 bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-ink-muted">{property.bathrooms}</span>
            <span>kupaon.</span>
          </span>
          <span className="w-px h-3 bg-slate-200" />
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-ink-muted">{property.max_guests}</span>
            <span>gostiju</span>
          </span>
        </div>

        {/* Price */}
        <div className="mt-4 pt-4 border-t border-emerald-900/[0.07] flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-[26px] text-ink tracking-tight tabular-nums leading-none">
              {formatCurrency(property.base_price)}
            </span>
            <span className="text-[12.5px] text-ink-faint">/ noć</span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[10.5px] tracking-[0.2em] uppercase text-emerald-700 group-hover:gap-2 transition-all">
            Rezerviraj
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
