import { createClient } from '@/lib/supabase/server';
import PricingClient, { type PricingModalState } from '@/components/admin/PricingClient';
import type { Property, PropertyImage, SiteSettings } from '@/types/database';

type SearchParams = {
  edit?: string;
};

type PropertyWithImages = Property & { images?: PropertyImage[] };

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const [propsRes, settingsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('*, images:property_images(*)')
      .order('sort_order'),
    supabase.from('site_settings').select('currency_symbol').single(),
  ]);

  const properties = (propsRes.data || []) as PropertyWithImages[];
  const currencySymbol = (settingsRes.data as Pick<SiteSettings, 'currency_symbol'> | null)?.currency_symbol ?? '€';

  const initialModal: PricingModalState = params.edit
    ? { kind: 'edit', id: params.edit }
    : null;

  return (
    <PricingClient
      initialProperties={properties}
      currencySymbol={currencySymbol}
      initialModal={initialModal}
    />
  );
}
