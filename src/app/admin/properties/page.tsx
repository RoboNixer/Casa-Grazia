import { createClient } from '@/lib/supabase/server';
import PropertiesClient, { type PropertyModalState } from '@/components/admin/PropertiesClient';
import type { Property, SiteSettings } from '@/types/database';

type SearchParams = {
  edit?: string;
  new?: string;
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const [propRes, settingsRes] = await Promise.all([
    supabase.from('properties').select('*, images:property_images(*)').order('sort_order'),
    supabase.from('site_settings').select('currency_symbol').single(),
  ]);

  const properties = (propRes.data || []) as Property[];
  const currencySymbol = (settingsRes.data as SiteSettings | null)?.currency_symbol ?? '€';

  const initialModal: PropertyModalState = params.new === '1'
    ? { kind: 'new' }
    : params.edit
    ? { kind: 'edit', id: params.edit }
    : null;

  const singleMode = process.env.NEXT_PUBLIC_SINGLE_PROPERTY_MODE === 'true';

  return (
    <PropertiesClient
      initialProperties={properties}
      currencySymbol={currencySymbol}
      initialModal={initialModal}
      singleMode={singleMode}
    />
  );
}
