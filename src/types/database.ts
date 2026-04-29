export interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  phone: string;
  email: string;
  address: string;
  google_maps_url: string;
  facebook_url: string;
  instagram_url: string;
  whatsapp: string;
  currency: string;
  currency_symbol: string;
  check_in_time: string;
  check_out_time: string;
  terms_and_conditions: string;
  cancellation_policy: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  description: string;
  short_description: string;
  property_type: 'apartment' | 'villa' | 'studio' | 'house' | 'room';
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  base_price: number;
  cleaning_fee: number;
  amenities: string[];
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  alt_text: string;
  is_cover: boolean;
  sort_order: number;
  created_at: string;
}

export interface SeasonalPricing {
  id: string;
  property_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_per_night: number;
  min_nights: number;
  created_at: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'partial';

export interface Booking {
  id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_country: string;
  check_in: string;
  check_out: string;
  num_guests: number;
  num_nights: number;
  total_price: number;
  cleaning_fee: number;
  notes: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface BlockedDate {
  id: string;
  property_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

export interface Review {
  id: string;
  property_id: string;
  booking_id: string | null;
  guest_name: string;
  rating: number;
  comment: string;
  is_visible: boolean;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  alt_text: string;
  category: string;
  sort_order: number;
  created_at: string;
}
