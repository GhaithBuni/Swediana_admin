"use client";
import { useEffect, useState } from "react";
import { authStorage } from "@/app/lib/auth";

export default function DashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const token = authStorage.getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/moving`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading bookings...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>

      <div className="grid gap-4">
        {bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found</p>
        ) : (
          bookings.map((booking: any) => (
            <div key={booking._id} className="bg-white p-6 rounded-lg shadow">
              {/* Display booking details */}
              <h3 className="font-semibold">{booking.size}</h3>
              <p className="text-gray-600">{booking.date}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
