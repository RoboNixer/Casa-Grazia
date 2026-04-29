import type { Viewport } from 'next';
import Sidebar from '@/components/admin/Sidebar';
import AdminTopbar from '@/components/admin/AdminTopbar';
import MobileBottomNav from '@/components/admin/MobileBottomNav';

export const viewport: Viewport = {
  themeColor: '#f5f7fa',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-route="admin" className="flex min-h-screen bg-[#f5f7fa]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopbar />
        <main className="flex-1">
          {/* pb-24 on mobile so content isn't hidden behind the bottom nav */}
          <div
            className="px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-8 max-w-[1360px] mx-auto"
            style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
          >
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
