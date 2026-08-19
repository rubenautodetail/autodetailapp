/**
 * Booking flow shell.
 *
 * The whole booking flow is a committed dark canvas. Individual steps paint
 * their own dark root, but anything that escapes them — overscroll, the
 * bottom-nav padding in the locale layout, horizontal overflow from a wide
 * child — would otherwise reveal the light theme background as white patches
 * around the dark panels. This shell owns the floor for every step, and
 * `overflow-x-clip` stops any stray wide element from making the page pan
 * sideways on mobile.
 *
 * globals.css pairs with the `data-booking-shell` marker to paint the <body>
 * behind the translucent MobileBottomNav as well.
 */
export default function BookingLayout({ children }: { children: React.ReactNode }) {
    return (
        <div data-booking-shell className="min-h-[100dvh] overflow-x-clip bg-[#131835]">
            {children}
        </div>
    );
}
