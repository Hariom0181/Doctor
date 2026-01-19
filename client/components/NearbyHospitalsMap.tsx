import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons (Vite / React)
// This prevents the "marker-icon.png 404" errors
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};
fixLeafletIcons();

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  hospital: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface NearbyHospitalsMapProps {
  linkedDoctor?: Doctor;
  patientLocation?: { lat: number; lng: number };
}

export function NearbyHospitalsMap({ linkedDoctor, patientLocation }: NearbyHospitalsMapProps) {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    patientLocation || null
  );
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Get Location
  useEffect(() => {
    if (patientLocation) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 19.076, lng: 72.8777 }) // Default fallback
      );
    }
  }, [patientLocation]);

  // 2. Fetch Hospitals
  useEffect(() => {
    if (!userLocation) return;
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const query = `[out:json];(node["amenity"~"hospital|clinic"](around:5000,${userLocation.lat},${userLocation.lng}););out center;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: query });
        const data = await res.json();
        setNearbyHospitals(data.elements.map((el: any) => ({
          id: el.id,
          name: el.tags?.name || 'Medical Center',
          lat: el.lat || el.center?.lat,
          lng: el.lon || el.center?.lon,
        })).slice(0, 10)); // Limit to 10 to improve performance
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [userLocation]);

  // 3. Define Icons (Memoized to prevent re-creation on render)
  const icons = useMemo(() => ({
    user: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }),
    doctor: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }),
    hospital: new L.Icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })
  }), []);

  if (!userLocation) {
    return (
      <Card className="p-8 flex justify-center items-center text-muted-foreground">
        Loading Map...
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" /> Healthcare Map
          </CardTitle>
          {linkedDoctor && <Badge variant="secondary" className="bg-red-50 text-red-700">My Doctor</Badge>}
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative h-[450px]">
        {/* KEY FIX: The key prop forces a fresh re-render when location changes */}
        <MapContainer
          key={`${userLocation.lat}-${userLocation.lng}`} 
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* User Marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.user}>
            <Popup>You are here</Popup>
          </Marker>

          {/* Linked Doctor Marker - STRICT NULL CHECK */}
          {linkedDoctor && linkedDoctor.latitude && linkedDoctor.longitude ? (
            <Marker 
              position={[linkedDoctor.latitude, linkedDoctor.longitude]} 
              icon={icons.doctor}
            >
              <Popup>
                <div className="font-bold">{linkedDoctor.name}</div>
                <div className="text-xs">{linkedDoctor.hospital}</div>
              </Popup>
            </Marker>
          ) : null}

          {/* Hospital Markers */}
          {nearbyHospitals.map((h) => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={icons.hospital}>
              <Popup>
                <div className="font-bold text-blue-600">{h.name}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {loading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-3 py-1 rounded-full shadow text-xs font-bold animate-pulse border">
            UPDATING...
          </div>
        )}
      </CardContent>
    </Card>
  );
}